/**
 * WC HUNTER — Check-in en 10 segundos
 * GPS -> baño más cercano (o uno nuevo) -> 1 toque de valoración -> foto opcional -> recompensa.
 * Funciona en modo comunidad (servidor valida distancia, cooldown y XP) y en modo local (demo).
 */
import { store } from '../state.js';
import { backend } from '../backend.js';
import { esc, makePhotoVersions } from '../utils.js';
import { reverseGeocode } from '../geo.js';
import { calculateDistanceMeters, formatDistance } from '../engines/wcEngine.js';

const NEAR_RADIUS = 150; // m (el servidor aplica el mismo límite)

const RATINGS = [
  { value: 5, emoji: '👑', label: 'Trono', cls: 'from-emerald-500 to-emerald-400 text-slate-950' },
  { value: 3, emoji: '😐', label: 'Pasable', cls: 'from-amber-500 to-yellow-400 text-slate-950' },
  { value: 1, emoji: '🤢', label: 'Desastre', cls: 'from-rose-600 to-rose-400 text-white' }
];

const TYPES = [
  ['public_street', '🚻 WC público'], ['cafe', '☕ Cafetería'], ['restaurant', '🍔 Restaurante'],
  ['shopping_mall', '🛍️ Centro comercial'], ['museum', '🏛️ Museo'], ['train', '🚆 Estación'],
  ['gas_station', '⛽ Gasolinera'], ['luxury_hotel', '🏨 Hotel'], ['public_park', '🌳 Parque'],
  ['beach', '🏖️ Playa'], ['university_top', '🎓 Universidad'], ['stadium', '🏟️ Estadio'], ['other', '🏠 Otro']
];

let S = null; // estado del modal (solo vive mientras está abierto)

const freshState = () => ({
  step: 'locating', pos: null, error: '', busy: false,
  candidates: [], selected: null,
  rating: null, closed: false, noPaper: false, noSoap: false, comment: '',
  name: '', type: 'public_street',
  photo: null, photoPreview: null,
  geo: null, result: null
});

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 } // posición fresca: el check-in valida distancia
    );
  });
}

function nearbyCandidates(pos) {
  return store.wcs
    .filter(w => !w.hidden)
    .map(w => ({ wc: w, dist: calculateDistanceMeters(pos.lat, pos.lng, w.latitude, w.longitude) }))
    .filter(x => x.dist <= NEAR_RADIUS)
    .sort((a, b) => a.dist - b.dist);
}

async function locate(container) {
  S.step = 'locating';
  S.error = '';
  draw(container);
  const pos = await getPosition();
  if (!S) return;
  if (!pos) {
    S.step = 'error';
    S.error = 'No pude obtener tu ubicación. Activa el GPS y da permiso de ubicación al navegador.';
    return draw(container);
  }
  S.pos = pos;
  store.userLocation = { ...store.userLocation, lat: pos.lat, lng: pos.lng, name: 'Tu ubicación actual' };
  S.geo = reverseGeocode(pos.lat, pos.lng).then(info => {
    if (info) store.userLocation = { ...store.userLocation, city: info.city, country: info.country };
    return info;
  });
  try {
    await store.fetchNearby(pos.lat, pos.lng, NEAR_RADIUS);
  } catch (e) { /* seguimos con lo que haya en memoria */ }
  if (!S) return;
  S.candidates = nearbyCandidates(pos);
  const wanted = store.checkin?.wcId;
  if (wanted && store.wcs.some(w => w.id === wanted)) {
    S.selected = wanted;
    S.step = 'rate';
  } else {
    S.step = 'pick';
  }
  draw(container);
}

function ratingButtons() {
  return `
    <div class="grid grid-cols-3 gap-2.5">
      ${RATINGS.map(r => `
        <button type="button" data-rating="${r.value}"
          class="tactile-btn py-4 rounded-2xl flex flex-col items-center gap-1 font-black text-xs border-2 transition
                 ${S.rating === r.value && !S.closed ? `bg-gradient-to-b ${r.cls} border-white/70 scale-[1.04] shadow-xl` : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'}">
          <span class="text-3xl">${r.emoji}</span><span>${r.label}</span>
        </button>`).join('')}
    </div>`;
}

function extrasBlock({ showPhoto = true } = {}) {
  const canPhoto = store.remote && showPhoto;
  return `
    <div class="flex flex-wrap gap-2 text-xs font-bold">
      <button type="button" data-toggle="closed" class="px-3 py-2 rounded-xl border ${S.closed ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-300'}">🔒 Estaba cerrado</button>
      <button type="button" data-toggle="noPaper" class="px-3 py-2 rounded-xl border ${S.noPaper ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'}">🧻 Sin papel</button>
      <button type="button" data-toggle="noSoap" class="px-3 py-2 rounded-xl border ${S.noSoap ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'}">🧴 Sin jabón</button>
    </div>
    ${canPhoto ? `
      <div>
        <input id="ci-photo" type="file" accept="image/*" capture="environment" class="hidden" />
        <button type="button" id="ci-photo-btn" class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed ${S.photo ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-600 text-slate-300'} text-xs font-black">
          ${S.photoPreview ? `<img src="${esc(S.photoPreview)}" alt="" class="w-10 h-10 rounded-lg object-cover" /> Foto lista (+10 XP) · cambiar` : '📸 Añadir foto del lugar (+10 XP)'}
        </button>
        <p class="text-[10px] text-slate-500 mt-1">Solo el lugar (puerta, cartel, lavabos). Nunca personas. Se elimina la ubicación EXIF.</p>
      </div>` : ''}
    <input id="ci-comment" maxlength="280" value="${esc(S.comment)}" placeholder="Un consejo o comentario (opcional)"
      class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500" />`;
}

function body() {
  switch (S.step) {
    case 'locating':
      return `<div class="py-10 text-center"><div class="text-5xl animate-bounce">📡</div><p class="mt-3 text-sm font-black text-white">Buscando tu posición…</p><p class="text-xs text-slate-400 mt-1">Para confirmar que estás de verdad en el baño</p></div>`;

    case 'error':
      return `<div class="py-8 text-center"><div class="text-5xl">🛰️❌</div><p class="mt-3 text-sm font-bold text-rose-300">${esc(S.error)}</p>
        <button id="ci-retry" class="tactile-btn mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">🔄 Reintentar</button></div>`;

    case 'pick': {
      const first = store.remote ? '+60 XP' : '';
      return `
        ${S.error ? `<p class="text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5">${esc(S.error)}</p>` : ''}
        <p class="text-xs text-slate-400 font-semibold">Estás en <span class="text-amber-400 font-black">${esc(store.userLocation.city || 'tu zona')}</span>. ¿Qué baño estás pisando?</p>
        <div class="flex flex-col gap-2.5">
          ${S.candidates.length ? S.candidates.map(({ wc, dist }) => `
            <button type="button" data-pick="${esc(wc.id)}" class="tactile-btn text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-black text-white truncate">${esc(wc.name)}</div>
                <div class="text-[11px] text-slate-400 truncate">📍 ${esc(formatDistance(dist))}${wc.address ? ' · ' + esc(wc.address) : ''}</div>
              </div>
              <span class="flex-shrink-0 text-xs font-black ${wc.unrated ? 'text-amber-300' : 'text-emerald-400'}">${wc.unrated ? `❔ ¡sé el primero! ${first}` : `${esc(wc.score)}/100`}</span>
            </button>`).join('')
          : `<div class="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center text-xs text-slate-300">No hay baños registrados a menos de ${NEAR_RADIUS} m de ti. <strong class="text-amber-300">¡Descubre el primero!</strong></div>`}
          <button type="button" id="ci-new" class="tactile-amber-btn bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2">➕ Es un baño nuevo (+100 XP)</button>
          ${!store.remote ? `<button type="button" id="ci-detailed" class="text-[11px] font-bold text-slate-400 hover:text-white underline">Prefiero rellenar todos los detalles</button>` : ''}
        </div>`;
    }

    case 'rate': {
      const wc = store.wcs.find(w => w.id === S.selected);
      if (!wc) return '<p class="text-xs text-rose-300">Ese baño ya no está disponible.</p>';
      const ready = S.closed || S.rating;
      return `
        <div>
          <h3 class="text-base font-black text-white leading-tight">${esc(wc.name)}</h3>
          <p class="text-[11px] text-slate-400">${wc.unrated ? '❔ Nadie lo ha valorado aún: ¡serás el primero!' : `Nota actual ${esc(wc.score)}/100 · ${esc(wc.verified_by_count)} check-ins`}</p>
        </div>
        ${ratingButtons()}
        ${extrasBlock()}
        ${S.error ? `<p class="text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5">${esc(S.error)}</p>` : ''}
        <button type="button" id="ci-submit" ${ready && !S.busy ? '' : 'disabled'} class="tactile-btn w-full ${ready ? 'bg-gradient-to-r from-emerald-500 to-primary text-slate-950' : 'bg-slate-800 text-slate-500'} font-black text-sm py-3.5 rounded-2xl shadow-xl">
          ${S.busy ? '⏳ Enviando…' : '✅ Hacer check-in (+15 XP)'}
        </button>
        <button type="button" id="ci-back" class="text-[11px] font-bold text-slate-400 hover:text-white">← Elegir otro baño</button>`;
    }

    case 'new': {
      const ready = S.name.trim().length >= 2 && (S.closed || S.rating);
      return `
        <div>
          <label class="block text-xs font-black uppercase text-slate-300 mb-1">Nombre del sitio *</label>
          <input id="ci-name" maxlength="80" value="${esc(S.name)}" placeholder="Ej. Bar Manolo, Estación Sants, Museo…"
            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500" />
        </div>
        <select id="ci-type" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none">
          ${TYPES.map(([v, l]) => `<option value="${v}" ${S.type === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <p class="text-xs font-black text-slate-300 -mb-1">¿Qué tal estaba?</p>
        ${ratingButtons()}
        ${extrasBlock()}
        ${S.error ? `<p class="text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5">${esc(S.error)}</p>` : ''}
        <button type="button" id="ci-submit-new" ${ready && !S.busy ? '' : 'disabled'} class="tactile-amber-btn w-full ${ready ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-500'} font-black text-sm py-3.5 rounded-2xl shadow-xl">
          ${S.busy ? '⏳ Publicando…' : '🏆 Publicar descubrimiento (+100 XP)'}
        </button>
        <button type="button" id="ci-back" class="text-[11px] font-bold text-slate-400 hover:text-white">← Volver</button>`;
    }

    case 'done': {
      const r = S.result;
      return `
        <div class="text-center py-4 flex flex-col items-center gap-3">
          <div class="text-6xl animate-bounce">${r.first ? '🏆' : '🎉'}</div>
          <h3 class="text-lg font-black text-white">${r.first ? '¡Primero en documentarlo!' : '¡Check-in hecho!'}</h3>
          <p class="text-xs text-slate-400 -mt-2">${esc(r.name)}</p>
          ${r.rarity ? `<span class="rarity-pill ${esc(r.rarity)}">${esc(r.rarity)}</span>` : ''}
          ${r.remote ? `
            <div class="text-3xl font-black text-amber-400">+${esc(r.xp)} XP</div>
            <ul class="w-full max-w-xs text-left text-xs font-semibold text-slate-300 bg-slate-800/70 border border-slate-700 rounded-2xl p-3 flex flex-col gap-1">
              ${(r.breakdown || []).map(b => `<li class="flex justify-between"><span>${esc(b.label)}</span><span class="text-emerald-400 font-black">+${esc(b.xp)}</span></li>`).join('')}
            </ul>` : ''}
          <div class="flex gap-2 w-full max-w-xs mt-1">
            ${r.wcId ? `<button id="ci-open" class="tactile-btn flex-1 bg-slate-800 border border-slate-600 text-white font-black text-xs py-3 rounded-2xl">📋 Ver ficha</button>` : ''}
            <button id="ci-close2" class="tactile-btn flex-1 bg-gradient-to-r from-emerald-500 to-primary text-slate-950 font-black text-xs py-3 rounded-2xl">Listo</button>
          </div>
        </div>`;
    }
    default:
      return '';
  }
}

function draw(container) {
  if (!S) return;
  const titles = { locating: '📍 Check-in', error: '📍 Check-in', pick: '📍 ¿Dónde estás?', rate: '📍 Check-in', new: '➕ Baño nuevo', done: '🏅 ¡Listo!' };
  container.innerHTML = `
    <div class="fixed inset-0 z-[2100] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Check-in">
      <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        <div class="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between">
          <h2 class="text-base font-black text-white">${titles[S.step] || '📍 Check-in'}</h2>
          <button id="ci-close" type="button" aria-label="Cerrar" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm">✕</button>
        </div>
        <div class="overflow-y-auto p-5 flex flex-col gap-3.5 text-slate-100">${body()}</div>
      </div>
    </div>`;
  bind(container);
}

function bind(container) {
  const $ = (sel) => container.querySelector(sel);
  const all = (sel) => container.querySelectorAll(sel);

  $('#ci-close')?.addEventListener('click', () => store.closeCheckin());
  $('.fixed.inset-0')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) store.closeCheckin(); });
  $('#ci-close2')?.addEventListener('click', () => store.closeCheckin());
  $('#ci-retry')?.addEventListener('click', () => locate(container));
  $('#ci-back')?.addEventListener('click', () => { S.step = 'pick'; S.error = ''; S.selected = null; draw(container); });
  $('#ci-detailed')?.addEventListener('click', () => { store.closeCheckin(); store.openAddModal(); });
  $('#ci-new')?.addEventListener('click', () => { S.step = 'new'; S.error = ''; draw(container); });
  $('#ci-open')?.addEventListener('click', () => { const id = S.result.wcId; store.closeCheckin(); store.openWcDetail(id); });

  all('[data-pick]').forEach(b => b.addEventListener('click', () => { S.selected = b.dataset.pick; S.step = 'rate'; S.error = ''; draw(container); }));
  all('[data-rating]').forEach(b => b.addEventListener('click', () => { S.rating = Number(b.dataset.rating); S.closed = false; draw(container); }));
  all('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.toggle;
    S[k] = !S[k];
    if (k === 'closed' && S.closed) S.rating = null;
    draw(container);
  }));

  $('#ci-comment')?.addEventListener('input', (e) => { S.comment = e.target.value; });
  $('#ci-name')?.addEventListener('input', (e) => {
    S.name = e.target.value;
    const ready = S.name.trim().length >= 2 && (S.closed || S.rating);
    const btn = $('#ci-submit-new');
    if (btn) btn.disabled = !ready || S.busy;
  });
  $('#ci-type')?.addEventListener('change', (e) => { S.type = e.target.value; });

  $('#ci-photo-btn')?.addEventListener('click', () => $('#ci-photo').click());
  $('#ci-photo')?.addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (S.photoPreview) URL.revokeObjectURL(S.photoPreview);
    S.photo = f;
    S.photoPreview = URL.createObjectURL(f);
    draw(container);
  });

  $('#ci-submit')?.addEventListener('click', () => submitExisting(container));
  $('#ci-submit-new')?.addEventListener('click', () => submitNew(container));
}

async function maybeUploadPhoto() {
  if (!(store.remote && S.photo)) return null;
  const { full, thumb } = await makePhotoVersions(S.photo);
  return backend.uploadPhoto(full, thumb);
}

const CLEAN = { 5: 'clean', 3: 'normal', 1: 'dirty' };

async function submitExisting(container) {
  const wc = store.wcs.find(w => w.id === S.selected);
  if (!wc || S.busy) return;
  S.busy = true; S.error = '';
  draw(container);
  try {
    if (store.remote) {
      const photoPath = await maybeUploadPhoto();
      const res = await store.remoteCheckIn({
        wcId: wc.id, rating: S.closed ? null : S.rating, status: S.closed ? 'closed' : 'open',
        hasPaper: S.noPaper ? false : null, hasSoap: S.noSoap ? false : null,
        comment: S.comment.trim() || null, photoPath, lat: S.pos.lat, lng: S.pos.lng
      });
      S.result = { remote: true, wcId: wc.id, name: wc.name, xp: res.xp_awarded, breakdown: res.breakdown, first: res.first_to_document, rarity: res.rarity };
    } else {
      const ok = store.verifyWC(wc.id, {
        status: S.closed ? 'closed' : 'open', has_paper: !S.noPaper, has_soap: !S.noSoap,
        cleanliness: S.closed ? undefined : CLEAN[S.rating]
      });
      if (!ok) throw new Error('Ya verificaste este baño hace poco. Vuelve más tarde.');
      S.result = { remote: false, wcId: wc.id, name: wc.name, rarity: wc.rarity };
    }
    S.step = 'done';
  } catch (e) {
    S.error = e.message || 'No se pudo completar el check-in.';
  }
  S.busy = false;
  draw(container);
}

async function submitNew(container) {
  if (S.busy) return;
  S.busy = true; S.error = '';
  draw(container);
  try {
    const info = (await S.geo) || {};
    const city = info.city || store.userLocation.city || '';
    const country = info.country || store.userLocation.country || '';
    const name = S.name.trim();

    if (store.remote) {
      const created = await store.remoteCreateWc({
        name, lat: S.pos.lat, lng: S.pos.lng, userLat: S.pos.lat, userLng: S.pos.lng,
        type: S.type, address: info.address || null, city, country
      });
      let breakdown = [...(created.breakdown || [])];
      let xp = created.xp_awarded;
      let first = false;
      try {
        const photoPath = await maybeUploadPhoto();
        const ci = await store.remoteCheckIn({
          wcId: created.wc_id, rating: S.closed ? null : S.rating, status: S.closed ? 'closed' : 'open',
          hasPaper: S.noPaper ? false : null, hasSoap: S.noSoap ? false : null,
          comment: S.comment.trim() || null, photoPath, lat: S.pos.lat, lng: S.pos.lng
        });
        breakdown = breakdown.concat(ci.breakdown || []);
        xp += ci.xp_awarded;
        first = ci.first_to_document;
      } catch (e) {
        store.showToast(`⚠️ El baño se creó, pero la valoración falló: ${e.message}`, 'info', 5000);
      }
      S.result = { remote: true, wcId: created.wc_id, name, xp, breakdown, first, rarity: created.rarity };
    } else {
      const ok = store.addNewWC({
        name, city, country, address: info.address || '', latitude: S.pos.lat, longitude: S.pos.lng,
        type: S.type, access_type: 'free', paper: !S.noPaper, soap: !S.noSoap,
        initial_rating: S.closed ? 3 : S.rating, comment: S.comment
      }, { openDetail: false });
      if (!ok) throw new Error('No se pudo crear el baño. Revisa los datos.');
      const created = store.wcs[0];
      S.result = { remote: false, wcId: created.id, name: created.name, rarity: created.rarity, first: true };
    }
    S.step = 'done';
  } catch (e) {
    S.error = e.message || 'No se pudo publicar.';
    if (e.code === 'duplicate') {
      S.step = 'pick';
      S.candidates = nearbyCandidates(S.pos);
    }
  }
  S.busy = false;
  draw(container);
}

export function renderCheckinModal(container) {
  if (!store.checkin) {
    if (S?.photoPreview) URL.revokeObjectURL(S.photoPreview);
    S = null;
    container.innerHTML = '';
    return;
  }
  if (!S) {
    S = freshState();
    locate(container);
    return;
  }
  draw(container);
}
