/**
 * WC HUNTER — Ficha Detallada del WC V2.0
 * Ficha estructurada en los 4 Pilares: Calidad, Estado, Fiabilidad y Volvería.
 */
import { store } from '../state.js';
import { getSemanticStatus, formatWouldReturn, formatAccessBadge, formatRelativeTime, getScoreRatingText } from '../engines/wcEngine.js';
import { evaluateRarity } from '../engines/gameEngine.js';

export function renderWcDetailModal(container) {
  const wc = store.selectedWc;
  if (!wc) {
    container.innerHTML = '';
    return;
  }

  const semantic = getSemanticStatus(wc);
  const wouldRet = formatWouldReturn(wc.would_return_ratio);
  const access = formatAccessBadge(wc);
  const rarityInfo = evaluateRarity(wc);
  const b = wc.score_breakdown || { cleanliness: 90, odor: 80, paper: 95, soap: 90, privacy: 85 };

  container.innerHTML = `
    <div class="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <!-- Cabecera de Ficha -->
        <div class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rarity-pill ${wc.rarity}">${wc.rarity}</span>
            <span class="text-xs font-black text-amber-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              🎯 Dif. ${rarityInfo.difficulty}/10
            </span>
            ${wc.is_secret ? `<span class="bg-purple-950 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-lg border border-purple-500/40">🔐 SECRETO</span>` : ''}
          </div>
          <button id="close-detail-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-black text-sm transition">
            ✕
          </button>
        </div>

        <!-- Contenido Scrollable -->
        <div class="overflow-y-auto px-6 py-5 flex flex-col gap-4 text-slate-100">
          
          <!-- Título y Ubicación -->
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-white leading-tight">${wc.name}</h1>
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>📍</span> <span>${wc.address}, ${wc.city}</span>
            </p>
          </div>

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
              ${wc.opening_hours}
            </span>
          </div>

          <!-- 2. LOS 4 PILARES DE HIGIENE & CALIDAD (Stitch Screen 2 Design) -->
          <div class="bg-surface-container/90 border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            
            <!-- Hero de Puntuación con Anillo Circular -->
            <div class="flex items-center justify-between border-b border-white/5 pb-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-2xl shadow-xl ${wc.score >= 85 ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-emerald-500/20' : (wc.score >= 70 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-500/20')}">
                  <span>${wc.score}</span>
                  <span class="text-[9px] font-bold uppercase tracking-wider opacity-80 leading-none">PUNTOS</span>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-white">${getScoreRatingText(wc.score)}</h3>
                  <p class="text-xs text-slate-400 font-semibold mt-0.5">
                    Verificado ${formatRelativeTime(wc.last_verified_at)}
                  </p>
                  <span class="text-[11px] font-bold text-emerald-400 mt-0.5 block">
                    👍 ${wouldRet.percent}% de cazadores volvería
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                  🛡️ ${wc.confidence}% conf.
                </span>
                <span class="text-[10px] text-slate-400 font-bold mt-1">
                  ${wc.verified_by_count || 14} validaciones
                </span>
              </div>
            </div>

            <!-- Desglose de los 4 Pilares con Barras de Progreso -->
            <div class="flex flex-col gap-3">
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
                  <span class="text-purple-400 font-extrabold">${wc.equipment.wheelchair ? '100%' : '50%'}</span>
                </div>
                <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div class="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500" style="width: ${wc.equipment.wheelchair ? 100 : 50}%"></div>
                </div>
              </div>
            </div>

          </div>

          <!-- WIDGET DE VALIDACIÓN RÁPIDA 1-TAP (Stitch Microinteractions) -->
          <div class="bg-surface-container/90 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
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
                <span class="text-[9px] text-rose-200">+20 XP</span>
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
          <div id="quick-verify-box" class="bg-surface-container/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-base">📝</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white">Reporte Detallado</h3>
              </div>
              <span class="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                +15 XP
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
                  <button type="button" data-v2-clean="clean" class="verify-btn active">🧼 Limpio</button>
                  <button type="button" data-v2-clean="normal" class="verify-btn">😐 Pasable</button>
                  <button type="button" data-v2-clean="dirty" class="verify-btn">🤢 Sucio</button>
                </div>
              </div>

              <button type="submit" class="tactile-btn w-full bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg transition mt-2 flex items-center justify-center gap-1.5">
                <span>🛡️</span>
                <span>Confirmar Reporte Completo (+15 XP)</span>
              </button>
            </form>
          </div>

          <!-- DESCUBIERTO POR (Atribución del Hunter) -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-base">🔎</span>
              <div>
                <span class="text-slate-400">Descubierto por:</span>
                <strong class="text-amber-400 ml-1">@${wc.discovered_by || 'PolM'}</strong>
              </div>
            </div>
            <span class="text-slate-400 font-semibold">
              ${wc.verified_by_count || 14} Hunters lo han verificado
            </span>
          </div>

        </div>
      </div>
    </div>
  `;

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

  // Attach 1-Tap quick verification listeners (Stitch UI)
  const quickClean = container.querySelector('#quick-tap-clean');
  if (quickClean) {
    quickClean.addEventListener('click', () => {
      store.verifyWC(wc.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' });
      renderWcDetailModal(container);
    });
  }

  const quickPaper = container.querySelector('#quick-tap-paper');
  if (quickPaper) {
    quickPaper.addEventListener('click', () => {
      store.verifyWC(wc.id, { status: 'open', has_paper: false, has_soap: true, cleanliness: 'normal' });
      renderWcDetailModal(container);
    });
  }

  const quickClosed = container.querySelector('#quick-tap-closed');
  if (quickClosed) {
    quickClosed.addEventListener('click', () => {
      store.verifyWC(wc.id, { status: 'closed', has_paper: false, has_soap: false, cleanliness: 'dirty' });
      renderWcDetailModal(container);
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

        const report = {
          status: statusBtn?.getAttribute('data-v2-status') || 'open',
          has_paper: paperBtn?.getAttribute('data-v2-paper') === 'true',
          has_soap: soapBtn?.getAttribute('data-v2-soap') === 'true',
          cleanliness: cleanBtn?.getAttribute('data-v2-clean') || 'clean'
        };

        // BUG-03: verifyWC ya lanza toast de +15 XP internamente vía addXP — no duplicar
        store.verifyWC(wc.id, report);
        renderWcDetailModal(container);
      });
  }
}
