/**
 * WC HUNTER - Algoritmos Matematicos y Motores de Calculo V1.0
 *
 * NOTA: calculateWCScore, calculateConfidence, getSemanticStatus y formatRelativeTime
 * viven en js/engines/wcEngine.js (unico source of truth).
 * Este fichero contiene unicamente los algoritmos exclusivos de gamificacion y rareza.
 */

/**
 * Calcula la rareza de un WC en base a su tipo, dificultad y exclusividad
 */
export function calculateRarityAndDifficulty(wc) {
  const typeRarityMap = {
    airplane: 'MYTHIC',
    police_station: 'MYTHIC',
    train: 'EPIC',
    stadium: 'EPIC',
    university_top: 'EPIC',
    luxury_hotel: 'LEGENDARY',
    vip_lounge: 'LEGENDARY',
    museum: 'RARE',
    beach: 'RARE',
    shopping_mall: 'COMMON',
    gas_station: 'COMMON',
    public_park: 'COMMON',
    public_street: 'COMMON',
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
  switch (action) {
    case 'ADD_WC':
      return 50;
    case 'FIRST_REVIEW':
      return 20;
    case 'VERIFICATION':
      return 15;
    case 'ADD_PHOTO':
      return 20;
    case 'DISCOVERY':
      return 100;
    case 'DISCOVERY_CONFIRMED':
      return 50;
    case 'SECRET_WC_FOUND':
      return 150;
    case 'RARE_WC_FOUND':
      if (metadata.rarity === 'MYTHIC') return 500;
      if (metadata.rarity === 'LEGENDARY') return 250;
      if (metadata.rarity === 'EPIC') return 100;
      if (metadata.rarity === 'RARE') return 50;
      return 20;
    default:
      return 10;
  }
}

/**
 * Escala de Niveles y Titulos por XP: XP = 100 * Level ^ 1.6
 */
export function calculateUserLevel(xp) {
  const level = Math.max(1, Math.floor(Math.pow(Math.max(0, xp) / 100, 1 / 1.6)) + 1);
  const currentLevelBaseXP = Math.floor(100 * Math.pow(level - 1, 1.6));
  const nextLevelXP = Math.floor(100 * Math.pow(level, 1.6));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100)));

  let rankTitle = 'Novato del Retrete';
  if (level >= 100) rankTitle = 'Leyenda del Retrete';
  else if (level >= 75) rankTitle = 'Senor del Trono';
  else if (level >= 50) rankTitle = 'Maestro de la Porcelana';
  else if (level >= 30) rankTitle = 'Explorador de Cloacas';
  else if (level >= 20) rankTitle = 'Inspector de Higiene';
  else if (level >= 10) rankTitle = 'Hunter Certificado';
  else if (level >= 5) rankTitle = 'Caganer Promesa';

  return {
    level,
    rankTitle,
    currentXP: xp,
    nextLevelXP,
    progressPercent
  };
}