/**
 * WC HUNTER — Ficha Detallada del WC V2.0
 * Ficha estructurada en los 4 Pilares: Calidad, Estado, Fiabilidad y Volvería.
 */
import { store } from '../state.js';
import { mapManager } from '../map.js';
import { setMapPreviewWc } from './mapView.js';
import { getSemanticStatus, formatWouldReturn, formatAccessBadge, formatRelativeTime, getScoreRatingText, calculateDistanceMeters, formatDistance, formatWalkTime } from '../engines/wcEngine.js';
import { evaluateRarity } from '../engines/gameEngine.js';
import { esc, safeUrl } from '../utils.js';
import { backend } from '../backend.js';

export function renderWcDetailModal(container) {
  const wc = store.selectedWc;
  if (!wc) {
    container.innerHTML = '';
    return;
  }

  // Conservar el scroll al re-renderizar (p. ej. tras verificar)
  const prevScroll = container.querySelector('.detail-scroll')?.scrollTop || 0;
  const verifiedCount = wc.verified_by_count ?? 1;
  const accessibilityPct = (wc.equipment.wheelchair ? 50 : 0) + (wc.equipment.baby_changing ? 50 : 0);
  const photos = (wc.photos || []).map(p => ({ ...p, url: safeUrl(p.url) })).filter(p => p.url);
  const isFav = store.isFavorite(wc.id);
  const uLoc = store.userLocation;
  const meters = calculateDistanceMeters(uLoc.lat, uLoc.lng, wc.latitude, wc.longitude);
  const distStr = [formatDistance(meters), formatWalkTime(meters)].filter(Boolean).join(' · ');
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(wc.latitude)},${encodeURIComponent(wc.longitude)}&travelmode=walking`;
  const reviews = Array.isArray(wc.recent_reviews) ? wc.recent_reviews : [];

  const semantic = getSemanticStatus(wc);
  const wouldRet = formatWouldReturn(wc.would_return_ratio);
  const access = formatAccessBadge(wc);
  const rarityInfo = evaluateRarity(wc);
  const b = wc.score_breakdown || { cleanliness: 90, odor: 80, paper: 95, soap: 90, privacy: 85 };

  container.innerHTML = `
    <div class="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Ficha del WC">
      <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

        <!-- Cabecera de Ficha -->
        <div class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rarity-pill ${esc(wc.rarity)}">${esc(wc.rarity)}</span>
            <span class="text-xs font-black text-amber-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              🎯 Dif. ${rarityInfo.difficulty}/10
            </span>
            ${wc.is_secret ? `<span class="bg-purple-950 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-purple-500/40">🔐 SECRETO</span>` : ''}
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button id="detail-fav-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border ${isFav ? 'border-rose-500/60 text-rose-400' : 'border-slate-700 text-slate-300'} flex items-center justify-center text-sm transition active:scale-90" title="${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}" aria-label="Favorito">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <button id="detail-share-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center text-sm transition active:scale-90" title="Compartir este WC" aria-label="Compartir WC">
              📤
            </button>
            <button id="close-detail-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-black text-sm transition" aria-label="Cerrar ficha">
              ✕
            </button>
          </div>
        </div>

        <!-- Contenido Scrollable -->
        <div class="detail-scroll overflow-y-auto px-6 py-5 flex flex-col gap-4 text-slate-100">

          <!-- Título y Ubicación -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                📍 A ${esc(distStr)} de ti
              </span>
              <span class="text-[11px] font-extrabold ${semantic.color === 'green' ? 'text-emerald-400' : (semantic.color === 'red' ? 'text-rose-400' : 'text-amber-400')}">
                ${semantic.label}
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-white leading-tight">${esc(wc.name)}</h1>
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>🗺️</span> <span>${esc(wc.address)}, ${esc(wc.city)}${wc.country ? `, ${esc(wc.country)}` : ''}</span>
            </p>
            ${wc.personality_desc ? `<p class="text-xs text-slate-300 italic mt-2">${esc(wc.personality_tag)} — “${esc(wc.personality_desc)}”</p>` : ''}
          </div>

          <!-- Botones de Navegación Directa (Stitch Screen 2 Primary CTA) -->
          <div class="grid grid-cols-2 gap-2.5">
            <button type="button" id="detail-tactical-route-btn" class="tactile-cyan-btn bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-black text-xs py-3 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-2">
              <span class="text-base">🧭</span>
              <span>Ruta en Radar</span>
            </button>
            <a href="${esc(navUrl)}" target="_blank" rel="noopener" class="tactile-btn bg-slate-800 hover:bg-slate-700 text-white border border-white/10 font-black text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-2">
              <span class="text-base">↗</span>
              <span>Google Maps</span>
            </a>
          </div>

          ${(wc.hunter_tip || wc.access_code) ? `
            <!-- SECRETO / TIP DEL CAZADOR Y CÓDIGO DE ACCESO -->
            <div class="bg-gradient-to-r from-amber-950/50 via-slate-900 to-purple-950/40 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-lg">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>💡</span> <span>INTELIGENCIA HUNTER · SECRETO DE ACCESO</span>
                </span>
                ${wc.access_code ? `
                  <button type="button" id="copy-code-btn" class="text-[11px] font-black bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-400/40 transition flex items-center gap-1" title="Copiar código o clave">
                    <span>🔑 ${esc(wc.access_code)}</span>
                    <span class="text-[9px] opacity-80">📋</span>
                  </button>
                ` : ''}
              </div>
              ${wc.hunter_tip ? `<p class="text-xs text-slate-200 font-medium leading-relaxed">${esc(wc.hunter_tip)}</p>` : ''}
            </div>
          ` : ''}

          ${photos.length ? `
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">📸 FOTOS DE CAZADORES (${photos.length})</span>
              <div class="flex gap-2 overflow-x-auto no-scrollbar">
                ${photos.map(p => `
                  <div class="relative flex-shrink-0 group">
                    <img src="${esc(p.url)}" alt="${esc(p.caption || 'Foto del WC')}" loading="lazy" referrerpolicy="no-referrer" class="h-28 w-36 rounded-2xl border border-white/10 object-cover" />
                    ${p.hunter ? `<span class="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-[9px] font-black text-cyan-300 px-1.5 py-0.5 rounded-lg border border-white/10">@${esc(p.hunter)}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="p-3 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
              <span class="flex items-center gap-2"><span class="text-base">📸</span> <span>Sin fotos todavía de este trono</span></span>
              <span class="text-[11px] font-bold text-emerald-400">+10 XP al validar con foto</span>
            </div>
          `}

          <!-- 1. INFORMACIÓN DE ACCESO (Prioritaria arriba de todo) -->
          <div class="p-3.5 rounded-2xl border ${access.bgClass} flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${access.icon}</span>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CONDICIONES DE ACCESO</span>
                <span class="text-sm font-black text-white">${access.type} · ${access.cost}</span>
                <p class="text-xs ${access.colorClass} font-semibold mt-0.5">${access.requirement}</p>
              </div>
            </div>
            <span class="text-xs text-slate-300 font-bold bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              ${esc(wc.opening_hours)}
            </span>
          </div>

          <!-- 2. LOS 4 PILARES DE HIGIENE & CALIDAD (Stitch Screen 2 Design) -->
          <div class="bg-surface-container/90 border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            
            <!-- Hero de Puntuación con Anillo Circular -->
            <div class="flex items-center justify-between border-b border-white/5 pb-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-2xl shadow-xl ${wc.score >= 85 ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-emerald-500/20' : (wc.score >= 70 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-500/20')}">
                  <span>${wc.unrated ? '?' : esc(wc.score)}</span>
                  <span class="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">PUNTOS</span>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-white">${wc.unrated ? 'SIN VALORAR' : getScoreRatingText(wc.score)}</h3>
                  <p class="text-xs text-slate-400 font-semibold mt-0.5">
                    Verificado ${formatRelativeTime(wc.last_verified_at)}
                  </p>
                  <span class="text-[11px] font-bold text-emerald-400 mt-0.5 block">
                    ${wouldRet.total > 0 ? `👍 ${wouldRet.percent}% de cazadores volvería` : '👍 Sin votos todavía'}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                  🛡️ ${wc.unrated ? '—' : esc(wc.confidence) + '%'} conf.
                </span>
                <span class="text-[10px] text-slate-400 font-bold mt-1">
                  ${verifiedCount} ${verifiedCount === 1 ? 'validación' : 'validaciones'}
                </span>
              </div>
            </div>

            <!-- Desglose de los 4 Pilares con Barras de Progreso -->
            ${wc.unrated ? `
              <div class="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 text-center">
                <div class="text-3xl">❔</div>
                <p class="text-sm font-black text-amber-300 mt-1">Nadie ha valorado este baño todavía</p>
                <p class="text-xs text-slate-300 mt-1">Haz check-in y serás <strong>el primero en documentarlo</strong> (+45 XP extra).</p>
              </div>` : ''}
            <div class="flex flex-col gap-3 ${wc.unrated ? 'hidden' : ''}">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">DESGLOSE DE LOS 4 PILARES</span>
              
              <!-- Pilar 1: Limpieza -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs font-bold">
                  <span class="text-slate-300 flex items-center gap-1.5"><span>🧼</span> Limpieza e Higiene</span>
                  <span class="${b.cleanliness >= 80 ? 'text-emerald-400' : 'text-amber-400'} font-extrabold">${b.cleanliness}%</span>
                </div>
                <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div class="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500" style="width: ${b.cleanliness}%"></div>
                </div>
              </div>

              <!-- Pilar 2: Privacidad -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs font-bold">
                  <span class="text-slate-300 flex items-center gap-1.5"><span>🔒</span> Privacidad y Acústica</span>
                  <span class="text-cyan-400 font-extrabold">${b.privacy}%</span>
                </div>
                <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500" style="width: ${b.privacy}%"></div>
                </div>
              </div>

              <!-- Pilar 3: Equipamiento -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs font-bold">
                  <span class="text-slate-300 flex items-center gap-1.5"><span>🧴</span> Confort y Equipamiento (Papel/Jabón)</span>
                  <span class="text-amber-400 font-extrabold">${Math.round((b.paper + b.soap) / 2)}%</span>
                </div>
                <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style="width: ${Math.round((b.paper + b.soap) / 2)}%"></div>
                </div>
              </div>

              <!-- Pilar 4: Accesibilidad -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs font-bold">
                  <span class="text-slate-300 flex items-center gap-1.5"><span>♿</span> Accesibilidad Universal & Bebé</span>
                  <span class="text-purple-400 font-extrabold">${accessibilityPct}%</span>
                </div>
                <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div class="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500" style="width: ${accessibilityPct}%"></div>
                </div>
              </div>
            </div>

          </div>

          ${store.remote ? `
            <!-- MODO COMUNIDAD: el check-in valida que estés en el sitio -->
            <button type="button" id="detail-checkin-btn" class="tactile-btn w-full bg-gradient-to-r from-emerald-500 to-primary text-slate-950 font-black text-sm py-4 rounded-3xl shadow-xl flex items-center justify-center gap-2">
              <span class="text-xl">📍</span><span>Estoy aquí · hacer check-in</span>
            </button>
            <div id="detail-photos" class="flex gap-2 overflow-x-auto no-scrollbar"></div>
          ` : ''}

          <!-- WIDGET DE VALIDACIÓN RÁPIDA 1-TAP (modo local) -->
          <div class="${store.remote ? 'hidden' : ''} bg-surface-container/90 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">⚡</span>
                <div>
                  <h3 class="text-sm font-extrabold text-white">Validación Rápida en 1-Tap</h3>
                  <p class="text-[11px] text-slate-400 font-medium">Pulsa cómo lo has encontrado para ganar XP al instante</p>
                </div>
              </div>
              <span class="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/30">
                +15 XP
              </span>
            </div>

            <!-- Botones Rápidos de 1 Click -->
            <div class="grid grid-cols-3 gap-2 mt-1">
              <button type="button" id="quick-tap-clean" class="tactile-btn bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-2xl flex flex-col items-center text-center gap-0.5">
                <span class="text-base">🟢</span>
                <span>Impecable</span>
                <span class="text-[9px] text-emerald-200">+15 XP</span>
              </button>
              <button type="button" id="quick-tap-paper" class="tactile-amber-btn bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-2xl flex flex-col items-center text-center gap-0.5">
                <span class="text-base">🧻</span>
                <span>Falta Papel</span>
                <span class="text-[9px] text-amber-200">+15 XP</span>
              </button>
              <button type="button" id="quick-tap-closed" class="tactile-panic-btn bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] py-2.5 px-2 rounded-2xl flex flex-col items-center text-center gap-0.5">
                <span class="text-base">🔒</span>
                <span>Cerrado</span>
                <span class="text-[9px] text-rose-200">+15 XP</span>
              </button>
            </div>
          </div>

          <!-- Rareza vs Dificultad -->
          <div class="bg-surface-container/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-slate-400">Rareza del WC</span>
              <span class="text-xs font-black text-amber-400">${rarityInfo.rarityScore}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">${rarityInfo.description}</p>
            ${rarityInfo.communityQuote ? `
              <p class="text-[11px] font-black text-amber-300/90 italic">"${rarityInfo.communityQuote}"</p>
            ` : ''}
            <div class="text-[10px] text-slate-500 font-semibold border-t border-slate-700/50 pt-1.5 mt-1">
              💡 La rareza mide la exclusividad y dificultad de registro, no su limpieza o confort.
            </div>
          </div>

          <!-- FORMULARIO DETALLADO DE VERIFICACIÓN -->
          <div id="quick-verify-box" class="${store.remote ? 'hidden' : ''} bg-surface-container/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-base">📝</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white">Reporte Detallado & Consejo</h3>
              </div>
              <span class="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                +15 a +25 XP
              </span>
            </div>

            <form id="v2-verify-form" class="flex flex-col gap-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-300">Estado</span>
                <div class="flex gap-1.5">
                  <button type="button" data-v2-status="open" class="verify-btn active">🟢 Abierto</button>
                  <button type="button" data-v2-status="closed" class="verify-btn">🔴 Cerrado</button>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-300">¿Hay papel?</span>
                <div class="flex gap-1.5">
                  <button type="button" data-v2-paper="true" class="verify-btn ${wc.equipment.paper ? 'active' : ''}">✅ Sí</button>
                  <button type="button" data-v2-paper="false" class="verify-btn ${!wc.equipment.paper ? 'active' : ''}">❌ No</button>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-300">¿Hay jabón?</span>
                <div class="flex gap-1.5">
                  <button type="button" data-v2-soap="true" class="verify-btn ${wc.equipment.soap ? 'active' : ''}">✅ Sí</button>
                  <button type="button" data-v2-soap="false" class="verify-btn ${!wc.equipment.soap ? 'active' : ''}">❌ No</button>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-slate-300">Limpieza</span>
                <div class="flex gap-1.5">
                  <button type="button" data-v2-clean="clean" class="verify-btn">🧼 Limpio</button>
                  <button type="button" data-v2-clean="normal" class="verify-btn active">😐 Pasable</button>
                  <button type="button" data-v2-clean="dirty" class="verify-btn">🤢 Sucio</button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <input
                  id="v2-verify-code"
                  type="text"
                  maxlength="40"
                  placeholder="🔑 Código puerta (opc.)"
                  value="${esc(wc.access_code || '')}"
                  class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  id="v2-verify-comment"
                  type="text"
                  maxlength="220"
                  placeholder="💬 Añade un tip o reseña para otros Hunters (+10 XP extra)..."
                  class="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button type="submit" class="tactile-btn w-full bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg transition mt-1 flex items-center justify-center gap-1.5">
                <span>🛡️</span>
                <span>Publicar Validación y Consejo (+15 / +25 XP)</span>
              </button>
            </form>
          </div>

          <!-- CRÓNICAS Y AVISOS RECIENTES DE CAZADORES (Feed de Comunidad Stitch Screen 2) -->
          <div class="bg-surface-container/70 border border-white/10 rounded-3xl p-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>💬</span>
                <span>Bitácora de Cazadores (${reviews.length})</span>
              </h3>
              <span class="text-[10px] font-bold text-emerald-400">Tiempo real</span>
            </div>

            ${reviews.length === 0 ? `
              <p class="text-xs text-slate-400 italic py-2 text-center">Aún no hay comentarios escritos. ¡Sé el primero en dejar una pista o código arriba (+10 XP)!</p>
            ` : `
              <div class="flex flex-col gap-2">
                ${reviews.slice(0, 6).map(r => `
                  <div class="bg-slate-950/75 border border-white/5 rounded-2xl p-3 flex items-start gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base flex-shrink-0">
                      ${esc(r.avatar || '🧔‍♂️')}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-black text-amber-300 truncate">@${esc(r.username || 'Hunter')}</span>
                        <span class="text-[10px] font-semibold text-slate-500 flex-shrink-0">${r.created_at ? formatRelativeTime(r.created_at) : 'Reciente'}</span>
                      </div>
                      <p class="text-xs text-slate-200 font-medium mt-1 leading-snug">${esc(r.comment)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- DESCUBIERTO POR (Atribución del Hunter) -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-base">🔎</span>
              <div>
                <span class="text-slate-400">Descubierto por:</span>
                <strong class="text-amber-400 ml-1">@${esc(wc.discovered_by || 'PolM')}</strong>
              </div>
            </div>
            <span class="text-slate-400 font-semibold">
              ${verifiedCount} ${verifiedCount === 1 ? 'verificación' : 'verificaciones'}
            </span>
          </div>
          ${store.remote ? `<button type="button" id="detail-report-btn" class="text-[11px] font-bold text-slate-500 hover:text-rose-400 self-center">🚩 Reportar este baño</button>` : ''}

        </div>
      </div>
    </div>
  `;

  const scroller = container.querySelector('.detail-scroll');
  if (scroller && prevScroll) scroller.scrollTop = prevScroll;

  // Modo comunidad: check-in, fotos de otros usuarios y reportar
  if (store.remote) {
    container.querySelector('#detail-checkin-btn')?.addEventListener('click', () => {
      store.closeWcDetail();
      store.openCheckin(wc.id);
    });

    backend.wcPhotos(wc.id).then(list => {
      const box = container.querySelector('#detail-photos');
      if (!box || store.selectedWc?.id !== wc.id || !list.length) return;
      // Se muestra la miniatura (~15 KB); la foto completa solo se descarga si se toca
      box.innerHTML = list.map(p => {
        const full = safeUrl(p.url);
        const thumb = safeUrl(p.thumb) || full;
        return full ? `<a href="${esc(full)}" target="_blank" rel="noopener" class="flex-shrink-0"><img src="${esc(thumb)}" data-full="${esc(full)}" alt="Foto de ${esc(p.username)}" loading="lazy" referrerpolicy="no-referrer" class="h-28 rounded-2xl border border-white/10 object-cover" /></a>` : '';
      }).join('');
      // Si falta la miniatura (foto antigua), se cae a la foto completa. Sin handlers en línea.
      box.querySelectorAll('img[data-full]').forEach(img => {
        img.addEventListener('error', () => {
          if (img.dataset.fallback !== '1') { img.dataset.fallback = '1'; img.src = img.dataset.full; }
        });
      });
    }).catch(() => {});

    container.querySelector('#detail-report-btn')?.addEventListener('click', async () => {
      if (!window.confirm('¿Reportar este baño (no existe, es privado, contenido inapropiado…)?')) return;
      try {
        const res = await store.remoteReport(wc.id, 'reportado desde la ficha');
        store.showToast(res.hidden ? '🚩 Gracias: el baño se ha ocultado para revisión.' : '🚩 Reporte enviado. ¡Gracias!', 'info');
        if (res.hidden) store.closeWcDetail();
      } catch (e) {
        store.showToast('No se pudo enviar el reporte.', 'info');
      }
    });
  }

  // Attach event listeners
  const backdrop = container.querySelector('.fixed.inset-0');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) store.closeWcDetail();
    });
  }

  const closeBtn = container.querySelector('#close-detail-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => store.closeWcDetail());
  }

  // Botón Favorito
  const favBtn = container.querySelector('#detail-fav-btn');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      store.toggleFavorite(wc.id);
      renderWcDetailModal(container);
    });
  }

  // Botón Compartir WC
  const shareBtn = container.querySelector('#detail-share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?wc=${encodeURIComponent(wc.id)}`;
      const shareText = `🚽 ${wc.name} (${wc.score}/100 en WC Hunter) · ${wc.address}, ${wc.city}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: `WC Hunter · ${wc.name}`, text: shareText, url: shareUrl });
          return;
        } catch (e) {}
      }
      try {
        await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`);
        store.showToast('🔗 Enlace del WC copiado al portapapeles', 'success', 2500);
      } catch (e) {
        store.showToast(`🔗 ${shareUrl}`, 'info', 4000);
      }
    });
  }

  // Botón Ver en Radar (centra mapa y abre preview)
  const showMapBtn = container.querySelector('#detail-show-map-btn');
  if (showMapBtn) {
    showMapBtn.addEventListener('click', () => {
      setMapPreviewWc(wc);
      mapManager.panTo(wc.latitude, wc.longitude, 17);
      store.closeWcDetail();
      if (store.currentTab !== 'map') {
        store.setTab('map');
      }
    });
  }

  // Botón Trazar Ruta en Radar (in-app tactical routing)
  const tacticalRouteBtn = container.querySelector('#detail-tactical-route-btn');
  if (tacticalRouteBtn) {
    tacticalRouteBtn.addEventListener('click', () => {
      const targetWc = wc;
      store.closeWcDetail();
      if (store.currentTab !== 'map') {
        store.setTab('map');
      }
      setTimeout(() => {
        mapManager.drawTacticalRoute(targetWc.latitude, targetWc.longitude, targetWc.name);
      }, 120);
    });
  }

  // Botón copiar código de puerta
  const copyCodeBtn = container.querySelector('#copy-code-btn');
  if (copyCodeBtn && wc.access_code) {
    copyCodeBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(wc.access_code);
        store.showToast(`🔑 Código "${wc.access_code}" copiado`, 'success', 2200);
      } catch (e) {
        store.showToast(`🔑 Código: ${wc.access_code}`, 'info', 2500);
      }
    });
  }

  // Attach 1-Tap quick verification listeners (Stitch UI)
  const quickClean = container.querySelector('#quick-tap-clean');
  if (quickClean) {
    // verifyWC notifica WC_VERIFIED y app.js re-renderiza la ficha: no hace falta repintar aqui
    quickClean.addEventListener('click', () => {
      store.verifyWC(wc.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' });
    });
  }

  const quickPaper = container.querySelector('#quick-tap-paper');
  if (quickPaper) {
    quickPaper.addEventListener('click', () => {
      store.verifyWC(wc.id, { status: 'open', has_paper: false, has_soap: true, cleanliness: 'normal' });
    });
  }

  const quickClosed = container.querySelector('#quick-tap-closed');
  if (quickClosed) {
    quickClosed.addEventListener('click', () => {
      // Un reporte de "cerrado" solo cambia el estado del WC (no equipamiento ni limpieza)
      store.verifyWC(wc.id, { status: 'closed' });
    });
  }

  const form = container.querySelector('#v2-verify-form');
  if (form) {
    const bindToggle = (selector) => {
      const btns = form.querySelectorAll(selector);
      btns.forEach(b => {
        b.addEventListener('click', () => {
          btns.forEach(other => other.classList.remove('active'));
          b.classList.add('active');
        });
      });
    };

    bindToggle('[data-v2-status]');
    bindToggle('[data-v2-paper]');
    bindToggle('[data-v2-soap]');
    bindToggle('[data-v2-clean]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const statusBtn = form.querySelector('[data-v2-status].active');
      const paperBtn = form.querySelector('[data-v2-paper].active');
      const soapBtn = form.querySelector('[data-v2-soap].active');
      const cleanBtn = form.querySelector('[data-v2-clean].active');
      const commentInput = form.querySelector('#v2-verify-comment');
      const codeInput = form.querySelector('#v2-verify-code');

      const report = {
        status: statusBtn?.getAttribute('data-v2-status') || 'open',
        has_paper: paperBtn?.getAttribute('data-v2-paper') === 'true',
        has_soap: soapBtn?.getAttribute('data-v2-soap') === 'true',
        cleanliness: cleanBtn?.getAttribute('data-v2-clean') || 'normal',
        comment: commentInput ? commentInput.value : '',
        access_code: codeInput ? codeInput.value : ''
      };

      // verifyWC lanza el toast de XP y notifica WC_VERIFIED (app.js repinta la ficha)
      store.verifyWC(wc.id, report);
    });
  }
}
