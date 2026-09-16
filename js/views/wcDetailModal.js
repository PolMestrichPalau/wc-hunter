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

          <!-- 2. LOS 4 PILARES: CALIDAD, ESTADO, FIABILIDAD Y VOLVERÍA -->
          <div class="grid grid-cols-2 gap-3">
            
            <!-- Pilar 1: CALIDAD (WC SCORE) -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">CALIDAD WC SCORE</span>
              <div class="text-4xl font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')} my-1.5">
                ${wc.score}<span class="text-xs text-slate-500 font-normal">/100</span>
              </div>
              <span class="text-xs font-black text-white tracking-wide uppercase">
                ${getScoreRatingText(wc.score)}
              </span>
            </div>

            <!-- Pilar 2: ESTADO ACTUAL -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">ESTADO ACTUAL</span>
              <div class="my-auto flex flex-col items-center">
                <span class="text-base font-black ${semantic.color === 'green' ? 'text-emerald-400' : (semantic.color === 'red' ? 'text-rose-400' : 'text-amber-400')} mt-2">
                  ${semantic.label}
                </span>
                <span class="text-xs text-slate-400 font-semibold mt-1">
                  Verificado ${formatRelativeTime(wc.last_verified_at)}
                </span>
              </div>
            </div>

            <!-- Pilar 3: FIABILIDAD -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">FIABILIDAD</span>
              <div class="text-3xl font-black text-blue-400 my-1">
                ${wc.confidence}<span class="text-xs text-slate-500 font-normal">%</span>
              </div>
              <span class="text-[11px] text-slate-300 font-semibold">
                🛡️ Información verificada
              </span>
            </div>

            <!-- Pilar 4: VOLVERÍA -->
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">REPETICIÓN</span>
              <div class="text-3xl font-black text-emerald-400 my-1">
                ${wouldRet.percent}<span class="text-xs text-slate-500 font-normal">%</span>
              </div>
              <span class="text-[11px] text-slate-300 font-semibold">
                👍 Volvería a usarlo
              </span>
            </div>
          </div>

          <!-- Frase Humana de Repetición -->
          <div class="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
            <span class="text-xs font-black text-emerald-300 flex items-center gap-2">
              <span class="text-base">👍</span>
              <span>${wouldRet.sentence}</span>
            </span>
            <span class="text-[11px] text-slate-400 font-bold">
              ${wouldRet.yesCount} de ${wouldRet.total} cazadores
            </span>
          </div>

          <!-- Desglose Limpio de Calidad -->
          <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-2.5">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-wider">Variables de Calidad</h3>

            <div class="grid grid-cols-2 gap-2 text-xs font-bold">
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span class="text-slate-300">🧼 Limpieza</span>
                <span class="${b.cleanliness >= 80 ? 'text-emerald-400' : 'text-amber-400'} font-black">${b.cleanliness}/100</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span class="text-slate-300">👃 Olor</span>
                <span class="${b.odor >= 80 ? 'text-emerald-400' : 'text-amber-400'} font-black">${b.odor}/100</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span class="text-slate-300">🧻 Papel Higiénico</span>
                <span class="${b.paper >= 80 ? 'text-emerald-400' : 'text-rose-400'} font-black">${b.paper}/100</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span class="text-slate-300">🧴 Jabón y Agua</span>
                <span class="text-slate-200 font-black">${b.soap}/100</span>
              </div>
              <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between col-span-2">
                <span class="text-slate-300">🔒 Privacidad y Cerrojo</span>
                <span class="text-slate-200 font-black">${b.privacy}/100</span>
              </div>
            </div>
          </div>

          <!-- Rareza vs Dificultad (Conceptos Separados) -->
          <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-2">
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

          <!-- WIDGET DE ACTUALIZACIÓN RÁPIDA (5 SEGUNDOS) -->
          <div id="quick-verify-box" class="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚡</span>
                <h3 class="text-sm font-black text-white">¿Cómo está ahora mismo?</h3>
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

              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs py-3 rounded-xl shadow transition mt-1 flex items-center justify-center gap-1.5">
                <span>🛡️</span>
                <span>Confirmar Verificación (+15 XP)</span>
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
  const closeBtn = container.querySelector('#close-detail-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => store.closeWcDetail());
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

      store.verifyWC(wc.id, report);
      store.showToast('✅ ¡Verificación registrada! +15 XP', 'success');
      renderWcDetailModal(container);
    });
  }
}
