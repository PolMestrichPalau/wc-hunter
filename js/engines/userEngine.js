/**
 * WC HUNTER — User Engine V2.1
 * Capa de usuario: títulos, récords personales, colecciones y progreso de logros.
 * Todo se calcula a partir del estado real (nada hardcodeado).
 */
import { ACHIEVEMENTS_CATALOG } from '../seedData.js';
import { calculateDistanceMeters, formatDistance } from './wcEngine.js';

export const UNLOCKED_TITLES_POOL = [
  "🚽 Señor del Retrete",
  "👑 Duque del Papel",
  "💩 El Caganer",
  "🧻 Príncipe del Papel",
  "🧼 Inspector de Higiene",
  "👃 Nariz de Hierro",
  "✈️ Cagón de Altura",
  "🔐 Maestro de los Secretos",
  "🌍 Cagador Internacional",
  "👑 Emperador del WC"
];

const RARITY_ORDER = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
const RARITY_NAMES = { COMMON: 'COMÚN', RARE: 'RARO', EPIC: 'ÉPICO', LEGENDARY: 'LEGENDARIO', MYTHIC: 'MÍTICO' };
const NO_DATA = { name: 'Aún sin datos', score: '—', tag: '—' };

/**
 * Devuelve el apodo dinámico del usuario combinando título y visitas
 */
export function generateUserNickname(user) {
  const baseTitle = String(user.title || '').replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim();
  return `El ${baseTitle} de los ${user.stats?.visited_count ?? 0} Retretes`;
}

/**
 * WCs "coleccionados": los que el usuario ha descubierto o verificado
 */
export function getCollectedWcs(wcs, user) {
  const log = user.verified_log || {};
  return wcs.filter(w => log[w.id] || w.discovered_by === user.username);
}

/**
 * Récords personales calculados sobre los WC coleccionados
 */
export function computeUserRecords(wcs, user, location) {
  const mine = getCollectedWcs(wcs, user);
  const pick = (list, scoreFn, dir = 'max') => {
    if (!list.length) return null;
    return list.reduce((best, w) => {
      const a = scoreFn(w);
      const b = scoreFn(best);
      return (dir === 'max' ? a > b : a < b) ? w : best;
    });
  };

  const rarest = pick(mine, w => RARITY_ORDER.indexOf(w.rarity) * 100 + (w.difficulty || 0));
  const cleanest = pick(mine, w => w.score_breakdown?.cleanliness ?? 0);
  const worstOdor = pick(mine, w => w.score_breakdown?.odor ?? 100, 'min');
  const priciest = pick(mine.filter(w => (w.price || 0) > 0), w => w.price || 0);
  const airborne = mine.find(w => w.type === 'airplane');
  const farthest = location
    ? pick(mine, w => calculateDistanceMeters(location.lat, location.lng, w.latitude, w.longitude))
    : null;

  return {
    rarestWc: rarest
      ? { name: rarest.name, score: RARITY_NAMES[rarest.rarity] || rarest.rarity, tag: rarest.rarity, icon: '🔴' }
      : NO_DATA,
    cleanestWc: cleanest
      ? { name: cleanest.name, score: `${cleanest.score_breakdown?.cleanliness ?? 0}/100`, tag: 'IMPECABLE', icon: '🧼' }
      : NO_DATA,
    worstOdorWc: worstOdor
      ? { name: worstOdor.name, score: `${worstOdor.score_breakdown?.odor ?? 0}/100`, tag: 'OLOR', icon: '👃' }
      : NO_DATA,
    mostExpensiveWc: priciest
      ? { name: priciest.name, score: `${priciest.price.toFixed(2)} €`, tag: 'DE PAGO', icon: '💰' }
      : NO_DATA,
    highestAltitudeWc: airborne
      ? { name: airborne.name, score: 'En vuelo', tag: 'CRUCERO', icon: '✈️' }
      : NO_DATA,
    farthestWc: farthest
      ? {
          name: farthest.name,
          score: formatDistance(calculateDistanceMeters(location.lat, location.lng, farthest.latitude, farthest.longitude)),
          tag: String(farthest.country || '—').toUpperCase(),
          icon: '🌍'
        }
      : NO_DATA
  };
}

/**
 * Definición de las colecciones del álbum (por tipo de lugar)
 */
export const COLLECTION_DEFS = [
  { id: 'public', name: 'Públicos Urbanos', icon: '🚽', types: ['public_street', 'public_park', 'public_building', 'shopping_mall', 'cafe', 'restaurant', 'gas_station', 'beach', 'other'] },
  { id: 'transport', name: 'Transporte y Viajes', icon: '✈️', types: ['train', 'airplane'] },
  { id: 'culture', name: 'Cultura y Estudios', icon: '🏛️', types: ['museum', 'university_top'] },
  { id: 'hotels', name: 'Hoteles y VIP', icon: '🏨', types: ['luxury_hotel', 'vip_lounge'] },
  { id: 'sports', name: 'Deportes y Estadios', icon: '🏟️', types: ['stadium'] },
  { id: 'extreme', name: 'Lugares Extremos', icon: '🗼', types: ['police_station', 'lighthouse'] },
  { id: 'secrets', name: 'WCs Secretos', icon: '🔐', predicate: w => w.is_secret }
];

/**
 * Colecciones con progreso real: coleccionados / total existentes en la base de datos
 */
export function computeCollections(wcs, user) {
  const mineIds = new Set(getCollectedWcs(wcs, user).map(w => w.id));
  return COLLECTION_DEFS.map(def => {
    const inCat = wcs.filter(w => def.predicate ? def.predicate(w) : def.types.includes(w.type));
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      total: inCat.length,
      collected: inCat.filter(w => mineIds.has(w.id)).length
    };
  });
}

/**
 * Progreso de un logro en función de las estadísticas del usuario
 */
export function getAchievementProgress(user, ach) {
  const s = user.stats || {};
  switch (ach.id) {
    case 'paper_hero': return { current: s.paper_verifs || 0, target: 10 };
    case 'clean_inspector': return { current: s.clean_reports || 0, target: 5 };
    case 'secret_master': return { current: s.secrets_found || 0, target: 5 };
    case 'city_explorer': return { current: (user.visited_cities || []).length, target: 3 };
    default: return { current: 0, target: 1 };
  }
}

/**
 * Próximos logros: los no desbloqueados y visibles, ordenados por cercanía a completarse
 */
export function computeUpcomingAchievements(user, limit = 4) {
  const unlocked = new Set(user.unlocked_achievements || []);
  return ACHIEVEMENTS_CATALOG
    .filter(a => !unlocked.has(a.id) && !a.hidden)
    .map(a => {
      const p = getAchievementProgress(user, a);
      return { ...a, current: Math.min(p.current, p.target), target: p.target, ratio: Math.min(1, p.current / p.target) };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit);
}
