/**
 * WC HUNTER — Capa de comunidad (Supabase). Carga el SDK solo si hay configuración.
 * Toda escritura va por funciones RPC validadas en el servidor (ver supabase/schema.sql).
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { calculateConfidence, formatAccessShort } from './engines/wcEngine.js';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const ERRORS = {
  not_authenticated: () => 'Necesitas conexión con la comunidad para hacer esto.',
  too_far: (n) => `Estás a ${n} m del WC. Acércate a menos de 150 m para hacer check-in.`,
  too_far_to_create: () => 'Solo puedes añadir baños que tengas a menos de 500 m.',
  cooldown: (n) => `Ya hiciste check-in aquí. Vuelve en ${n >= 60 ? Math.ceil(n / 60) + ' h' : n + ' min'}.`,
  daily_limit: () => 'Has llegado al límite diario. ¡Vuelve mañana!',
  duplicate: () => 'Ya hay un baño justo ahí. Haz check-in en ese.',
  location_required: () => 'Necesitamos tu ubicación para continuar.',
  bad_rating: () => 'Elige una valoración.',
  bad_name: () => 'El nombre debe tener entre 2 y 80 caracteres.',
  bad_location: () => 'Ubicación no válida.',
  bad_photo_path: () => 'La foto no es válida.',
  wc_not_found: () => 'Ese baño ya no existe.',
  username_taken: () => 'Ese nombre ya está cogido.',
  bad_profile: () => 'Nombre no válido (3-24 letras, números, _ . -).'
};

/** Traduce el error de Postgres ("too_far:230") a un mensaje en español. */
export function describeError(err) {
  const raw = String(err?.message || err || '');
  const m = raw.match(/^([a-z_]+)(?::(.+))?$/);
  if (m && ERRORS[m[1]]) return { code: m[1], arg: m[2], message: ERRORS[m[1]](Number(m[2]) || m[2]) };
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return { code: 'network', message: 'Sin conexión con la comunidad.' };
  return { code: 'unknown', message: 'Algo ha fallado. Inténtalo de nuevo.' };
}

/** Fila de wc_view (servidor) -> objeto WC del cliente (se completa en store.normalizeWc). */
export function rowToWc(r) {
  const count = Number(r.checkins_count) || 0;
  const unrated = count === 0 || r.score === null || r.score === undefined;
  const score = unrated ? 0 : Number(r.score);
  const eq = r.equipment || {};
  const paperOk = r.paper_ok ?? eq.paper ?? true;
  const soapOk = r.soap_ok ?? eq.soap ?? true;

  const wc = {
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address || '',
    city: r.city || '',
    country: r.country || '',
    type: r.type,
    rarity: r.rarity,
    access_type: r.access_type,
    price: Number(r.price) || 0,
    opening_hours: r.opening_hours || 'Horario no especificado',
    equipment: {
      paper: Boolean(paperOk), soap: Boolean(soapOk), water: true, mirror: true,
      dryer: Boolean(eq.dryer), baby_changing: Boolean(eq.baby_changing), wheelchair: Boolean(eq.wheelchair),
      bidet: false, lock_functional: true
    },
    score,
    score_breakdown: {
      cleanliness: score, odor: score, privacy: score, condition: score,
      paper: paperOk ? 90 : 30, soap: soapOk ? 85 : 40, price: r.access_type === 'paid' ? 60 : 95
    },
    current_status: r.status || 'open',
    last_verified_at: r.last_checkin_at || r.created_at,
    // "¿Volvería?" aproximado a partir de la nota media (>=4 estrellas ~ repetiría)
    would_return_ratio: unrated ? { yes: 0, no: 0 } : { yes: score, no: 100 - score },
    is_secret: Boolean(r.is_secret),
    photos: [],
    discovered_by: r.discovered_by || (r.source === 'osm' ? 'OpenStreetMap' : 'Anónimo'),
    reviews_count: count,
    verified_by_count: count,
    personality_tag: unrated ? '❔ SIN VALORAR' : '🚽 EL TRONO',
    personality_desc: '',
    unrated,
    source: r.source || 'user'
  };
  wc.access_label = formatAccessShort(wc);
  wc.confidence = unrated ? 0 : calculateConfidence({ ...wc, photos: [] }).confidence;
  return wc;
}

class Backend {
  constructor() {
    this.client = null;
    this.error = null;
  }

  get enabled() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  /** Conecta y asegura una sesión (anónima si hace falta). */
  async init() {
    if (!this.enabled) return false;
    if (this.client) return true;
    try {
      const { createClient } = await import(/* @vite-ignore */ SDK_URL);
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      const { data: { session } } = await this.client.auth.getSession();
      if (!session) {
        const { error } = await this.client.auth.signInAnonymously();
        if (error) throw error;
      }
      return true;
    } catch (e) {
      this.error = e;
      this.client = null;
      return false;
    }
  }

  async rpc(fn, args = {}) {
    const { data, error } = await this.client.rpc(fn, args);
    if (error) throw error;
    return data;
  }

  myProfile() { return this.rpc('my_profile'); }
  setProfile({ username = null, avatar = null, title = null }) {
    return this.rpc('set_profile', { p_username: username, p_avatar: avatar, p_title: title });
  }

  async wcsInBounds({ south, west, north, east }, limit = 500) {
    const rows = await this.rpc('wcs_in_bounds', { p_min_lat: south, p_min_lng: west, p_max_lat: north, p_max_lng: east, p_limit: limit });
    return rows.map(rowToWc);
  }

  async nearby(lat, lng, radius = 1000, limit = 100) {
    const rows = await this.rpc('nearby_wcs', { p_lat: lat, p_lng: lng, p_radius_m: radius, p_limit: limit });
    return rows.map(rowToWc);
  }

  checkIn({ wcId, rating = null, status = 'open', hasPaper = null, hasSoap = null, comment = null, photoPath = null, lat, lng }) {
    return this.rpc('check_in', {
      p_wc_id: wcId, p_rating: rating, p_status: status, p_has_paper: hasPaper, p_has_soap: hasSoap,
      p_comment: comment, p_photo_path: photoPath, p_lat: lat, p_lng: lng
    });
  }

  createWc({ name, lat, lng, userLat, userLng, type = 'other', accessType = 'free', price = 0, isSecret = false, address = null, city = null, country = null, equipment = {}, force = false }) {
    return this.rpc('create_wc', {
      p_name: name, p_lat: lat, p_lng: lng, p_user_lat: userLat, p_user_lng: userLng, p_type: type,
      p_access_type: accessType, p_price: price, p_is_secret: isSecret, p_address: address, p_city: city,
      p_country: country, p_equipment: equipment, p_force: force
    });
  }

  reportWc(wcId, reason = null) { return this.rpc('report_wc', { p_wc_id: wcId, p_reason: reason }); }

  async wcPhotos(wcId) {
    const rows = await this.rpc('wc_photos', { p_wc_id: wcId });
    return rows.map(r => ({ url: this.photoUrl(r.photo_path), username: r.username, created_at: r.created_at })).filter(p => p.url);
  }

  photoUrl(path) {
    if (!this.client || !path) return '';
    return this.client.storage.from('photos').getPublicUrl(path).data.publicUrl;
  }

  /** Sube una foto (Blob JPEG ya reducido) a photos/<uid>/<uuid>.jpg y devuelve la ruta. */
  async uploadPhoto(blob) {
    const { data: { session } } = await this.client.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error('not_authenticated');
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    const { error } = await this.client.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return path;
  }
}

export const backend = new Backend();
