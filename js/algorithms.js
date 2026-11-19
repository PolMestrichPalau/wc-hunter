/**
 * WC HUNTER - Algoritmos de gamificacion y rareza.
 *
 * - Puntuacion/confianza/estado/tiempo/distancia: js/engines/wcEngine.js
 * - Niveles y rangos: js/engines/gameEngine.js (calculateLevel, unica fuente de verdad)
 */

/**
 * Calcula la rareza de un WC en base a su tipo, dificultad y exclusividad.
 * La rareza maxima que puede autoasignarse un usuario es LEGENDARY (MYTHIC se reserva
 * a datos curados) para evitar farmeo de XP.
 */
export function calculateRarityAndDifficulty(wc) {
  const typeRarityMap = {
    airplane: 'EPIC',
    police_station: 'EPIC',
    lighthouse: 'EPIC',
    vip_lounge: 'EPIC',
    train: 'RARE',
    stadium: 'RARE',
    university_top: 'RARE',
    luxury_hotel: 'RARE',
    museum: 'RARE',
    beach: 'RARE',
    shopping_mall: 'COMMON',
    gas_station: 'COMMON',
    public_park: 'COMMON',
    public_street: 'COMMON',
    public_building: 'COMMON',
    restaurant: 'COMMON',
    cafe: 'COMMON',
    other: 'COMMON'
  };

  let rarity = typeRarityMap[wc.type] || 'COMMON';
  if (wc.is_secret) {
    if (rarity === 'COMMON') rarity = 'RARE';
    else if (rarity === 'RARE') rarity = 'EPIC';
    else if (rarity === 'EPIC') rarity = 'LEGENDARY';
  }

  let diff = 1;
  if (wc.access_type === 'customers_only') diff += 2;
  if (wc.access_type === 'key_required') diff += 3;
  if (wc.access_type === 'code_required') diff += 3;
  if (wc.access_type === 'paid') diff += 1;
  if (wc.is_secret) diff += 2;

  return {
    rarity,
    difficulty: Math.min(10, Math.max(1, diff))
  };
}

/**
 * Tabla de XP para acciones del Hunter
 */
export function calculateXPForAction(action, metadata = {}) {
  const rarity = metadata.rarity || 'COMMON';
  switch (action) {
    case 'ADD_WC':
      return 50;
    case 'FIRST_REVIEW':
      return 20;
    case 'VERIFICATION':
      return 15;
    case 'ADD_PHOTO':
    case 'PHOTO_USEFUL':
      return 20;
    case 'DISCOVERY':
      return 100;
    case 'DISCOVERY_CONFIRMED':
      return 50;
    case 'SECRET_WC_FOUND':
    case 'SECRET_FOUND':
      return 150;
    case 'TESTER_FEEDBACK':
      return 20;
    case 'RARE_WC_FOUND':
      if (rarity === 'MYTHIC') return 500;
      if (rarity === 'LEGENDARY') return 250;
      if (rarity === 'EPIC') return 100;
      if (rarity === 'RARE') return 50;
      return 20;
    default:
      return 10;
  }
}
