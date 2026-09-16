/**
 * WC HUNTER — User Engine V2.0
 * Capa de usuario, reputación, títulos desbloqueables y Récords Personales.
 */

export const INITIAL_USER_RECORDS = {
  rarestWc: { name: "Hotel W Barcelona (Planta 26)", score: "9,9/10", tag: "MÍTICO", icon: "🔴" },
  cleanestWc: { name: "WC Museo del Prado", score: "99/100", tag: "IMPECABLE", icon: "🧼" },
  worstOdorWc: { name: "Cabina Puerta del Sol", score: "14/100", tag: "INFIERNO", icon: "👃" },
  mostExpensiveWc: { name: "Atocha One Hundred Restrooms", score: "1,00 €", tag: "DE PAGO", icon: "💰" },
  highestAltitudeWc: { name: "Vuelo Madrid-Tokio", score: "11.200 m", tag: "CRUCERO", icon: "✈️" },
  farthestWc: { name: "Estación Central de Kioto", score: "10.420 km", tag: "JAPÓN", icon: "🌍" }
};

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

/**
 * Devuelve el apodo dinámico del usuario combinando título, especialidad y récord
 */
export function generateUserNickname(user) {
  const baseTitle = user.title.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim();
  return `El ${baseTitle} de los ${user.stats.visited_count} Retretes`;
}
