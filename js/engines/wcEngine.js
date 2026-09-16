/**
 * WC HUNTER — WC Data Engine V2.0
 * Capa de datos, calidad, estado, fiabilidad y condiciones de acceso.
 */

export const QUALITY_WEIGHTS = {
  cleanliness: 0.25,
  paper: 0.20,
  soap: 0.15,
  odor: 0.12,
  privacy: 0.10,
  condition: 0.08,
  price: 0.10
};

/**
 * Calcula el WC Score ponderado (0 - 100)
 */
export function calculateWCScore(breakdown, reviews = []) {
  const calcFromBreakdown = (b) => {
    return Math.round(
      (b.cleanliness ?? 70) * QUALITY_WEIGHTS.cleanliness +
      (b.paper ?? 70) * QUALITY_WEIGHTS.paper +
      (b.soap ?? 70) * QUALITY_WEIGHTS.soap +
      (b.odor ?? 70) * QUALITY_WEIGHTS.odor +
      (b.privacy ?? 70) * QUALITY_WEIGHTS.privacy +
      (b.condition ?? 70) * QUALITY_WEIGHTS.condition +
      (b.price ?? 70) * QUALITY_WEIGHTS.price
    );
  };

  if (!reviews || reviews.length === 0) {
    return calcFromBreakdown(breakdown || {});
  }

  const now = Date.now();
  let totalWeightedScore = 0;
  let totalWeight = 0;

  reviews.forEach(review => {
    const ageDays = (now - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recency = Math.exp(-0.05 * Math.max(0, ageDays)); // vida media ~14 días
    const rep = (review.user_reputation || 90) / 100;
    const weight = rep * recency;

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
 * Métrica de calidad verbal
 */
export function getScoreRatingText(score) {
  if (score >= 90) return 'EXCEPCIONAL';
  if (score >= 80) return 'MUY BUENO';
  if (score >= 70) return 'ACEPTABLE';
  if (score >= 50) return 'REGULAR';
  return 'DESASTRE';
}

/**
 * Calcula el Confidence Score (0 - 100%)
 */
export function calculateConfidence(wc, verifications = []) {
  const verifCount = verifications.length || (wc.reviews_count ? Math.min(10, Math.floor(wc.reviews_count / 2)) : 1);
  
  let baseScore = 40;
  if (verifCount >= 10) baseScore = 95;
  else if (verifCount >= 4) baseScore = 85;
  else if (verifCount >= 2) baseScore = 65;

  const uniqueUsers = new Set(verifications.map(v => v.user_id)).size || 1;
  const userBonus = Math.min(20, uniqueUsers * 5);

  let photoBonus = 0;
  const now = Date.now();
  if (wc.photos && wc.photos.length > 0) {
    const newestPhotoTime = Math.max(...wc.photos.map(p => new Date(p.uploaded_at).getTime()));
    const daysSincePhoto = (now - newestPhotoTime) / (1000 * 60 * 60 * 24);
    if (daysSincePhoto <= 7) photoBonus = 15;
    else if (daysSincePhoto <= 30) photoBonus = 5;
  }

  const lastVerifiedTime = wc.last_verified_at ? new Date(wc.last_verified_at).getTime() : (now - 1000 * 60 * 60 * 24 * 5);
  const hoursSince = (now - lastVerifiedTime) / (1000 * 60 * 60);

  let decay = 0.20;
  if (hoursSince <= 2) decay = 1.0;
  else if (hoursSince <= 24) decay = 0.90;
  else if (hoursSince <= 24 * 7) decay = 0.70;
  else if (hoursSince <= 24 * 30) decay = 0.45;

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
 * Semáforo y estado actual
 */
export function getSemanticStatus(wc) {
  if (wc.current_status === 'closed') {
    return {
      type: 'closed',
      color: 'red',
      badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      dotClass: 'bg-rose-500',
      text: 'Cerrado ahora',
      label: '🔴 Cerrado'
    };
  }
  if (wc.has_recent_incident) {
    return {
      type: 'incident',
      color: 'red',
      badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      dotClass: 'bg-rose-500',
      text: 'Incidencias reportadas',
      label: '🔴 Problemas recientes'
    };
  }

  const hours = (Date.now() - new Date(wc.last_verified_at).getTime()) / (1000 * 60 * 60);
  const conf = wc.confidence ?? 80;

  if (hours <= 3 && conf >= 70) {
    return {
      type: 'good',
      color: 'green',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      text: 'En buen estado ahora',
      label: '🟢 Verificado reciente'
    };
  }
  if (hours > 24 * 7 || conf < 45) {
    return {
      type: 'unknown',
      color: 'gray',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
      dotClass: 'bg-slate-400',
      text: 'Información desactualizada',
      label: '⚪ Poco verificado'
    };
  }
  return {
    type: 'moderate',
    color: 'yellow',
    badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dotClass: 'bg-amber-500',
    text: 'Parcialmente verificado',
    label: '🟡 Verificación moderada'
  };
}

/**
 * Métrica "¿Volvería?" humanizada
 */
export function formatWouldReturn(ratio) {
  const yes = ratio?.yes || 1;
  const no = ratio?.no || 0;
  const total = yes + no;
  const percent = Math.round((yes / total) * 100);
  return {
    percent,
    yesCount: yes,
    noCount: no,
    total,
    sentence: `${percent}% de los Hunters repetirían`
  };
}

/**
 * Formato de acceso estructurado
 */
export function formatAccessBadge(wc) {
  if (wc.access_type === 'free') {
    return {
      icon: '🟢',
      type: 'Público',
      cost: 'Gratis',
      requirement: 'Entrada libre',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/40 border-emerald-500/40'
    };
  }
  if (wc.access_type === 'customers_only') {
    return {
      icon: '🟡',
      type: 'Clientes',
      cost: 'Consumición',
      requirement: 'Solo clientes del local',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border-amber-500/40'
    };
  }
  if (wc.access_type === 'key_required') {
    return {
      icon: '🟡',
      type: 'Restringido',
      cost: 'Gratis o clientes',
      requirement: '🔑 Hay que pedir llave en barra/mostrador',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border-amber-500/40'
    };
  }
  if (wc.access_type === 'code_required') {
    return {
      icon: '🟡',
      type: 'Código',
      cost: 'Ticket',
      requirement: '🔢 Código impreso en el ticket de compra',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-950/40 border-amber-500/40'
    };
  }
  return {
    icon: '💰',
    type: 'De Pago',
    cost: `${(wc.price || 0.5).toFixed(2)} €`,
    requirement: wc.price > 0 ? `Pago de ${wc.price.toFixed(2)} € (moneda o torno)` : 'De pago',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 border-blue-500/40'
  };
}

/**
 * Tiempo relativo amigable
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

/**
 * Cálculo de distancia Haversine en metros
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
