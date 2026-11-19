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

// Prior poblacional global neutral independiente (elimina circularidad estadística)
export const GLOBAL_POPULATION_PRIOR = 70.0;

// Helper interno para sanitizar cualquier entrada numérica a [0, 100] anti-NaN
function sanitizeScore(val, defaultVal = 70) {
  const n = Number(val);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : defaultVal;
}

export function calcFromBreakdown(b = {}) {
  return Math.round(
    sanitizeScore(b.cleanliness, 70) * QUALITY_WEIGHTS.cleanliness +
    sanitizeScore(b.paper, 70) * QUALITY_WEIGHTS.paper +
    sanitizeScore(b.soap, 70) * QUALITY_WEIGHTS.soap +
    sanitizeScore(b.odor, 70) * QUALITY_WEIGHTS.odor +
    sanitizeScore(b.privacy, 70) * QUALITY_WEIGHTS.privacy +
    sanitizeScore(b.condition, 70) * QUALITY_WEIGHTS.condition +
    sanitizeScore(b.price, 70) * QUALITY_WEIGHTS.price
  );
}

/**
 * Calcula el WC Score ponderado empírico Bayesiano (0 - 100).
 * Modelo: Score = (m * μ0 + w_init * S_init + Σ W_i * S_i) / (m + w_init + Σ W_i)
 * donde:
 *  - μ0 = prior poblacional global neutral = 70.0 (regresión a la media ante el paso del tiempo)
 *  - m = pseudo-observaciones del prior = 1.5 (inercia neutral)
 *  - S_init = calcFromBreakdown(breakdown) con peso w_init = 1.0 (conserva la valoración inicial del creador)
 *  - W_i = R_i * e^(-0.05 * Δt_i) (reputación * decaimiento temporal con t_1/2 = 13.86 días)
 * Permite inyectar `now` para tests deterministas.
 */
export function calculateWCScore(breakdown, reviews = [], now = Date.now()) {
  const initialEstimate = calcFromBreakdown(breakdown || {});
  const priorMean = GLOBAL_POPULATION_PRIOR;
  const priorWeight = 1.5;
  const initialWeight = 1.0;

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return initialEstimate;
  }

  const validNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  let totalWeightedScore = initialWeight * initialEstimate;
  let totalWeight = initialWeight;

  for (const review of reviews) {
    if (!review) continue;
    const rawTime = Date.parse(review.created_at || review.timestamp);
    const reviewTime = Number.isFinite(rawTime) ? rawTime : validNow;
    const ageDays = Math.max(0, (validNow - reviewTime) / (1000 * 60 * 60 * 24));
    const recency = Math.exp(-0.05 * ageDays); // vida media ~13.86 días

    const rawRep = Number(review.user_reputation);
    const rep = Number.isFinite(rawRep) ? Math.max(0.05, Math.min(1.0, rawRep / 100)) : 0.8;
    const weight = rep * recency;

    let rScore = priorMean;
    if (review.score_breakdown && typeof review.score_breakdown === 'object') {
      rScore = calcFromBreakdown(review.score_breakdown);
    } else if (review.overall_rating !== undefined && review.overall_rating !== null) {
      const numRating = Number(review.overall_rating);
      rScore = Number.isFinite(numRating) ? Math.max(0, Math.min(100, numRating * 20)) : priorMean;
    }

    totalWeightedScore += rScore * weight;
    totalWeight += weight;
  }

  // Estimador Bayesiano con prior neutral poblacional m y conservación del estimador inicial
  const bayesianScore = (priorWeight * priorMean + totalWeightedScore) / (priorWeight + totalWeight);
  return Math.min(100, Math.max(0, Math.round(bayesianScore)));
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
 * Incorpora decaimiento temporal continuo C⁰, bonus por diversidad de usuarios únicos,
 * bonus por frescura fotográfica y penalización multivariable con decaimiento temporal de conflictos.
 * Permite inyectar `now` para reproducibilidad y tests deterministas.
 */
export function calculateConfidence(wc, verifications = [], now = Date.now()) {
  if (!wc || typeof wc !== 'object') {
    return { confidence: 5, hasContradiction: false, hoursSinceLastVerified: 0 };
  }
  const safeVerifs = Array.isArray(verifications) ? verifications : [];
  const validNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();

  // El número de verificaciones toma el mayor entre el histórico acumulado del WC y los reportes recibidos.
  const verifCount = Math.max(safeVerifs.length, Number(wc.verified_by_count) || 0) ||
    (wc.reviews_count ? Math.min(10, Math.floor(wc.reviews_count / 2)) : 1);

  // Escala calibrada para evitar saturación artificial
  let baseScore = 40;
  if (verifCount >= 10) baseScore = 85;
  else if (verifCount >= 4) baseScore = 75;
  else if (verifCount >= 2) baseScore = 60;

  const validVerifs = safeVerifs.filter(v => v && v.user_id);
  const uniqueUsers = validVerifs.length > 0 ? new Set(validVerifs.map(v => v.user_id)).size : 1;
  const userBonus = Math.min(10, uniqueUsers * 2);

  let photoBonus = 0;
  if (Array.isArray(wc.photos) && wc.photos.length > 0) {
    const photoTimes = wc.photos.map(p => Date.parse(p.uploaded_at || p.created_at)).filter(Number.isFinite);
    if (photoTimes.length > 0) {
      const newestPhotoTime = Math.max(...photoTimes);
      const daysSincePhoto = Math.max(0, (validNow - newestPhotoTime) / (1000 * 60 * 60 * 24));
      if (daysSincePhoto <= 7) photoBonus = 10;
      else if (daysSincePhoto <= 30) photoBonus = 5;
    }
  }

  const lastVerifiedRaw = Date.parse(wc.last_verified_at);
  const lastVerifiedTime = Number.isFinite(lastVerifiedRaw) ? lastVerifiedRaw : (validNow - 1000 * 60 * 60 * 24 * 5);
  const hoursSince = Math.max(0, (validNow - lastVerifiedTime) / (1000 * 60 * 60));

  // Decaimiento continuo suave C⁰ (sin saltos cliff effect):
  let decay;
  if (hoursSince <= 2) {
    decay = 1.0;
  } else if (hoursSince <= 24) {
    decay = 1.0 - 0.10 * ((hoursSince - 2) / 22); // 1.0 -> 0.90
  } else if (hoursSince <= 168) {
    decay = 0.90 - 0.20 * ((hoursSince - 24) / 144); // 0.90 -> 0.70
  } else if (hoursSince <= 720) {
    decay = 0.70 - 0.25 * ((hoursSince - 168) / 552); // 0.70 -> 0.45
  } else {
    decay = Math.max(0.20, 0.45 * Math.exp(-0.001 * (hoursSince - 720)));
  }

  // Detección multivariable de contradicciones recientes en ventana estricta de 72h
  let contradictionPenalty = 0;
  let hasContradiction = false;
  if (safeVerifs.length >= 2) {
    // 1. Filtrar solo reportes con timestamp válido dentro de la ventana de 72h
    const validWindowReports = safeVerifs.filter(v => {
      if (!v || !v.user_id) return false;
      const rawT = v.timestamp !== undefined ? v.timestamp : v.created_at;
      const t = Number.isFinite(Number(rawT)) ? Number(rawT) : Date.parse(rawT);
      return Number.isFinite(t) && (validNow - t) >= 0 && (validNow - t) <= 72 * 3600 * 1000;
    });

    // 2. Colapsar por usuario: solo cuenta la observación más reciente de cada usuario (elimina falsas contradicciones cronológicas)
    const latestByUser = new Map();
    for (const r of validWindowReports) {
      const rawT = r.timestamp !== undefined ? r.timestamp : r.created_at;
      const t = Number.isFinite(Number(rawT)) ? Number(rawT) : Date.parse(rawT);
      const prev = latestByUser.get(r.user_id);
      if (!prev || t > prev.time) {
        latestByUser.set(r.user_id, { ...r, time: t });
      }
    }

    const recent = Array.from(latestByUser.values());
    // Requiere al menos 2 usuarios distintos para declarar contradicción (antifraude anti-trolling individual)
    if (recent.length >= 2) {
      const paperReports = recent.map(v => v.has_paper).filter(v => typeof v === 'boolean');
      const soapReports = recent.map(v => v.has_soap).filter(v => typeof v === 'boolean');
      const statusReports = recent.map(v => v.status).filter(Boolean);

      const hasPaperConflict = paperReports.includes(true) && paperReports.includes(false);
      const hasSoapConflict = soapReports.includes(true) && soapReports.includes(false);
      const hasStatusConflict = statusReports.includes('open') && statusReports.includes('closed');

      if (hasStatusConflict) {
        contradictionPenalty = 45; // Máxima gravedad: abierto vs cerrado (-45)
        hasContradiction = true;
      } else if (hasPaperConflict || hasSoapConflict) {
        contradictionPenalty = 35; // Conflicto de suministros (-35)
        hasContradiction = true;
      }
    }
  }

  const preDecay = Math.min(100, baseScore + userBonus + photoBonus);
  let finalConfidence = Math.round(preDecay * decay - contradictionPenalty);
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
export function getSemanticStatus(wc, now = Date.now()) {
  if (!wc || typeof wc !== 'object') {
    return {
      type: 'unknown',
      color: 'gray',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
      dotClass: 'bg-slate-400',
      text: 'Sin datos',
      label: '⚪ Desconocido'
    };
  }
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

  const validNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const rawTime = Date.parse(wc.last_verified_at);
  const validTime = Number.isFinite(rawTime) ? rawTime : (validNow - 1000 * 60 * 60 * 24 * 30);
  const hours = (validNow - validTime) / (1000 * 60 * 60);
  const conf = Number.isFinite(Number(wc.confidence)) ? Number(wc.confidence) : 80;

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
  const yes = Number(ratio?.yes) || 0;
  const no = Number(ratio?.no) || 0;
  const total = yes + no;
  const percent = total > 0 ? Math.round((yes / total) * 100) : 0;
  return {
    percent,
    yesCount: yes,
    noCount: no,
    total,
    sentence: total > 0 ? `${percent}% de los Hunters repetirían` : 'Aún sin votos de "volvería"'
  };
}

/**
 * Etiqueta corta de acceso/precio para listas (cubre todos los tipos de acceso)
 */
export function formatAccessShort(wc) {
  switch (wc.access_type) {
    case 'free': return '🆓 Gratis';
    case 'customers_only': return '🍔 Solo clientes';
    case 'key_required': return '🔑 Pedir llave';
    case 'code_required': return '🔢 Código en ticket';
    default: return `💰 ${(Number(wc.price) || 0).toFixed(2)} €`;
  }
}

/**
 * Distancia legible: metros < 1 km, km con decimales; sin decimales a partir de 100 km.
 */
export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return km >= 100 ? `${Math.round(km).toLocaleString('es-ES')} km` : `${km.toFixed(1)} km`;
}

/**
 * Tiempo a pie, solo tiene sentido en distancias caminables (<= 3 km)
 */
export function formatWalkTime(meters) {
  if (!Number.isFinite(meters) || meters > 3000) return '';
  return `~${Math.max(1, Math.round(meters / 80))} min`;
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
 * Cálculo de distancia Haversine en metros con blindaje numérico en antípodas y sanitización anti-NaN.
 * Garantiza:
 * 1. Devuelve NaN explícito ante entradas nulas, indefinidas o fuera de rango geodésico [-90, 90] / [-180, 180] (nunca 0 silencioso).
 * 2. safeA = Math.max(0, Math.min(1, a)) garantiza 0% NaNs por imprecisión en antípodas terrestres.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  // Rechazar nulos, indefinidos, booleanos o strings vacíos/espacios
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null ||
      lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      typeof lat1 === 'boolean' || typeof lon1 === 'boolean' || typeof lat2 === 'boolean' || typeof lon2 === 'boolean') {
    return NaN;
  }
  if (typeof lat1 === 'string' && lat1.trim() === '') return NaN;
  if (typeof lon1 === 'string' && lon1.trim() === '') return NaN;
  if (typeof lat2 === 'string' && lat2.trim() === '') return NaN;
  if (typeof lon2 === 'string' && lon2.trim() === '') return NaN;

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2) ||
      nLat1 < -90 || nLat1 > 90 || nLat2 < -90 || nLat2 > 90 ||
      nLon1 < -180 || nLon1 > 180 || nLon2 < -180 || nLon2 > 180) {
    return NaN;
  }

  const R = 6371e3;
  const φ1 = (nLat1 * Math.PI) / 180;
  const φ2 = (nLat2 * Math.PI) / 180;
  const Δφ = ((nLat2 - nLat1) * Math.PI) / 180;
  const Δλ = ((nLon2 - nLon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const safeA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));

  return Math.round(R * c);
}
