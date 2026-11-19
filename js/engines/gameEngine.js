/**
 * WC HUNTER — Game Engine V2.0
 * Capa de gamificación, XP, niveles, rareza vs dificultad, misiones, logros y colecciones.
 */

import { calculateXPForAction } from '../algorithms.js';

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
 * Base de XP para un nivel determinado: XP(L) = Math.floor(100 * (L - 1)^1.6)
 */
export function getLevelXP(level) {
  const l = Number.isFinite(Number(level)) ? Math.max(1, Math.floor(Number(level))) : 1;
  return Math.floor(100 * Math.pow(l - 1, 1.6));
}

/**
 * Cálculo de Nivel y Progreso de XP
 * Curva: XP(L) = Math.floor(100 * (L - 1)^1.6)
 * Inversa exacta: L(XP) = floor((XP/100)^(1/1.6) + 1e-7) + 1, ajustado por búsqueda de frontera.
 * Garantiza 0 fallos de frontera en L=1..150 y sanitización completa ante NaN o tipos corruptos.
 */
export function calculateLevel(xp) {
  const numXP = Number(xp);
  let cleanXP = 0;
  if (numXP === Infinity || numXP >= 100000000) {
    cleanXP = 100000000;
  } else if (Number.isFinite(numXP)) {
    cleanXP = Math.max(0, Math.floor(numXP));
  }

  let level = Math.floor(Math.pow(cleanXP / 100, 1 / 1.6) + 1e-7) + 1;
  while (level > 1 && getLevelXP(level) > cleanXP) {
    level--;
  }
  while (getLevelXP(level + 1) <= cleanXP) {
    level++;
  }

  const currentBase = getLevelXP(level);
  const nextBase = getLevelXP(level + 1);
  const span = nextBase - currentBase;
  const percent = span > 0 ? Math.min(100, Math.max(0, Math.round(((cleanXP - currentBase) / span) * 100))) : 100;

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
    xp: cleanXP,
    currentBase,
    nextBase,
    percent
  };
}

/**
 * Recompensas XP unificadas (delega en calculateXPForAction de algorithms.js para garantizar única fuente de verdad)
 */
export function getActionXP(action, rarity = 'COMMON') {
  return calculateXPForAction(action, { rarity });
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
