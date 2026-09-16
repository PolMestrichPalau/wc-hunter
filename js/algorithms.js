/**
 * WC HUNTER — Algoritmos Matemáticos y Motores de Cálculo V1.0
 */

// Pesos del WC Score
export const SCORE_WEIGHTS = {
  cleanliness: 0.25, // Limpieza
  paper: 0.20,       // Papel higiénico
  soap: 0.15,        // Jabón y agua
  odor: 0.12,        // Olor (100 inodoro/fresco, 0 insoportable)
  privacy: 0.10,     // Privacidad (pestillo, cerramiento)
  condition: 0.08,   // Estado general / mantenimiento
  price: 0.10        // Relación precio/acceso (gratis = 100)
};

/**
 * Calcula el WC Score ponderado (0-100)
 * Pondera valoraciones individuales por antigüedad (decaimiento exponencial) y reputación del usuario.
 */
export function calculateWCScore(breakdown, reviews = []) {
  const calcFromBreakdown = (b) => {
    return Math.round(
      (b.cleanliness ?? 70) * SCORE_WEIGHTS.cleanliness +
      (b.paper ?? 70) * SCORE_WEIGHTS.paper +
      (b.soap ?? 70) * SCORE_WEIGHTS.soap +
      (b.odor ?? 70) * SCORE_WEIGHTS.odor +
      (b.privacy ?? 70) * SCORE_WEIGHTS.privacy +
      (b.condition ?? 70) * SCORE_WEIGHTS.condition +
      (b.price ?? 70) * SCORE_WEIGHTS.price
    );
  };

  if (!reviews || reviews.length === 0) {
    return calcFromBreakdown(breakdown || {});
  }

  const now = Date.now();
  let totalWeightedScore = 0;
  let totalWeight = 0;

  reviews.forEach(review => {
    const ageInDays = (now - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-0.05 * Math.max(0, ageInDays)); // vida media ~14 días
    const reputation = (review.user_reputation || 90) / 100;
    const weight = reputation * recencyFactor;

    const rScore = review.score_breakdown
      ? calcFromBreakdown(review.score_breakdown)
      : (review.overall_rating ? review.overall_rating * 20 : 70);

    totalWeightedScore += rScore * weight;
    totalWeight += weight;
  });

  if (totalWeight <= 0) return calcFromBreakdown(breakdown || {});
  return Math.min(100, Math.max(0, Math.round(totalWeightedScore / totalWeight)));
}

/**
 * Calcula el Confidence Score (0 - 100%)
 * Considera volumen de verificaciones, diversidad de usuarios, fotos recientes,
 * decaimiento temporal por inactividad y penalización por contradicciones.
 */
export function calculateConfidence(wc, verifications = []) {
  const verifCount = verifications.length || (wc.reviews_count ? Math.min(10, Math.floor(wc.reviews_count / 2)) : 1);
  
  // 1. Base por volumen
  let baseScore = 40;
  if (verifCount >= 10) baseScore = 95;
  else if (verifCount >= 4) baseScore = 85;
  else if (verifCount >= 2) baseScore = 65;

  // 2. Diversidad de usuarios
  const uniqueUsers = new Set(verifications.map(v => v.user_id)).size || 1;
  const userBonus = Math.min(20, uniqueUsers * 5);

  // 3. Evidencia fotográfica
  let photoBonus = 0;
  const now = Date.now();
  if (wc.photos && wc.photos.length > 0) {
    const newestPhotoTime = Math.max(...wc.photos.map(p => new Date(p.uploaded_at).getTime()));
    const daysSincePhoto = (now - newestPhotoTime) / (1000 * 60 * 60 * 24);
    if (daysSincePhoto <= 7) photoBonus = 15;
    else if (daysSincePhoto <= 30) photoBonus = 5;
  }

  // 4. Decaimiento temporal respecto a la última verificación
  const lastVerifiedTime = wc.last_verified_at ? new Date(wc.last_verified_at).getTime() : (now - 1000 * 60 * 60 * 24 * 5);
  const hoursSince = (now - lastVerifiedTime) / (1000 * 60 * 60);

  let decay = 0.20;
  if (hoursSince <= 2) decay = 1.0;
  else if (hoursSince <= 24) decay = 0.90;
  else if (hoursSince <= 24 * 7) decay = 0.70;
  else if (hoursSince <= 24 * 30) decay = 0.45;

  // 5. Penalización por contradicciones recientes
  let contradictionPenalty = 0;
  let hasContradiction = false;
  if (verifications.length >= 2) {
    const recent = verifications.slice(-3);
    const paperReports = recent.map(v => v.has_paper).filter(v => typeof v === 'boolean');
    if (paperReports.includes(true) && paperReports.includes(false)) {
      contradictionPenalty = 35;
      hasContradiction = true;
    }
  }

  let finalConfidence = Math.round((baseScore + userBonus + photoBonus) * decay - contradictionPenalty);
  finalConfidence = Math.max(5, Math.min(100, finalConfidence));

  return {
    confidence: finalConfidence,
    hasContradiction,
    hoursSinceLastVerified: Math.round(hoursSince)
  };
}

/**
 * Determina el estado semafórico visual para marcadores de mapa y listas
 * 🟢 Verde: Reciente (<3h) y fiable (>70%)
 * 🟡 Amarillo: Antiguo (>12h) o confianza media
 * 🔴 Rojo: Incidencias recientes, sin papel o cerrado
 * ⚪ Gris: Datos insuficientes
 */
export function getStatusSemantic(wc) {
  if (wc.current_status === 'closed') {
    return { color: 'red', text: 'Cerrado', label: '🔴 Cerrado', dotClass: 'bg-rose-500' };
  }
  if (wc.has_recent_incident) {
    return { color: 'red', text: 'Problemas reportados', label: '🔴 Problemas recientes', dotClass: 'bg-rose-500' };
  }

  const hours = (Date.now() - new Date(wc.last_verified_at).getTime()) / (1000 * 60 * 60);
  const conf = wc.confidence ?? 80;

  if (hours <= 3 && conf >= 70) {
    return { color: 'green', text: 'Información reciente y fiable', label: '🟢 Verificado reciente', dotClass: 'bg-emerald-500' };
  }
  if (hours > 24 * 7 || conf < 45) {
    return { color: 'gray', text: 'Información insuficiente', label: '⚪ Desactualizado', dotClass: 'bg-slate-400' };
  }
  return { color: 'yellow', text: 'Parcialmente verificado', label: '🟡 Verificación moderada', dotClass: 'bg-amber-500' };
}

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
 * Escala de Niveles y Títulos por XP: XP = 100 * Level ^ 1.6
 */
export function calculateUserLevel(xp) {
  const level = Math.max(1, Math.floor(Math.pow(Math.max(0, xp) / 100, 1 / 1.6)) + 1);
  const currentLevelBaseXP = Math.floor(100 * Math.pow(level - 1, 1.6));
  const nextLevelXP = Math.floor(100 * Math.pow(level, 1.6));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100)));

  let rankTitle = 'Novato del Retrete';
  if (level >= 100) rankTitle = '👑 Leyenda del Retrete';
  else if (level >= 75) rankTitle = 'Señor del Trono';
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

/**
 * Formatea tiempo relativo en español
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return 'Desconocido';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  return `hace ${months} meses`;
}
