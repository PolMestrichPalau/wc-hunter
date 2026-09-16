/**
 * WC HUNTER — Game Engine V2.0
 * Capa de gamificación, XP, niveles, rareza vs dificultad, misiones, logros y colecciones.
 */

export const RARITY_CONFIG = {
  COMMON: {
    name: 'COMÚN',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    description: 'WC habitual y de acceso frecuente.',
    rarityScore: '2,4/10'
  },
  RARE: {
    name: 'RARO',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    description: 'Menos habitual o en entornos culturales/hoteleros.',
    rarityScore: '5,8/10'
  },
  EPIC: {
    name: 'ÉPICO',
    color: '#a855f7',
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    description: 'Difícil de registrar: trenes en marcha, estadios o plantas altas.',
    rarityScore: '7,9/10'
  },
  LEGENDARY: {
    name: 'LEGENDARIO',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20',
    description: 'Muy pocos Hunters lo han documentado. Acceso exclusivo.',
    rarityScore: '9,3/10',
    communityQuote: 'Solo 18 Hunters lo han registrado.'
  },
  MYTHIC: {
    name: 'MÍTICO',
    color: '#ef4444',
    badgeClass: 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow-md shadow-rose-500/30 animate-pulse',
    description: 'Extremadamente raro. En aviones en crucero, comisarías o faros.',
    rarityScore: '9,9/10',
    communityQuote: 'Este WC pertenece al 0,5% más raro de WC Hunter.'
  }
};

/**
 * Cálculo de Nivel y Progreso de XP
 * Fórmula: XP = 100 * Level ^ 1.6
 */
export function calculateLevel(xp) {
  const level = Math.max(1, Math.floor(Math.pow(Math.max(0, xp) / 100, 1 / 1.6)) + 1);
  const currentBase = Math.floor(100 * Math.pow(level - 1, 1.6));
  const nextBase = Math.floor(100 * Math.pow(level, 1.6));
  const percent = Math.min(100, Math.max(0, Math.round(((xp - currentBase) / (nextBase - currentBase)) * 100)));

  let rank = 'Novato del Retrete';
  if (level >= 100) rank = '👑 Leyenda del Retrete';
  else if (level >= 75) rank = 'Señor del Trono';
  else if (level >= 50) rank = 'Maestro de la Porcelana';
  else if (level >= 30) rank = 'Explorador de Cloacas';
  else if (level >= 20) rank = 'Inspector de Higiene';
  else if (level >= 10) rank = 'Hunter Certificado';
  else if (level >= 5) rank = 'Caganer Promesa';

  return {
    level,
    rank,
    xp,
    nextBase,
    percent
  };
}

/**
 * Tabla de recompensas XP
 */
export function getActionXP(action, rarity = 'COMMON') {
  switch (action) {
    case 'DISCOVERY':
      if (rarity === 'MYTHIC') return 500;
      if (rarity === 'LEGENDARY') return 250;
      if (rarity === 'EPIC') return 150;
      if (rarity === 'RARE') return 120;
      return 100;
    case 'VERIFICATION':
      return 15;
    case 'SECRET_FOUND':
      return 150;
    case 'PHOTO_USEFUL':
      return 25;
    default:
      return 10;
  }
}

/**
 * Determina la rareza y la dificultad del WC
 * Recuerda: Rareza != Calidad
 */
export function evaluateRarity(wc) {
  const rarity = wc.rarity || 'COMMON';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.COMMON;
  
  let diff = wc.difficulty || 3;
  return {
    ...config,
    difficulty: diff,
    isSecret: Boolean(wc.is_secret)
  };
}
