/**
 * WC HUNTER — Ficha Detallada del WC & Verificación en 5 Segundos
 */
import { store } from '../state.js';
import { getStatusSemantic, formatRelativeTime } from '../algorithms.js';

export function renderWcDetailModal(container) {
  const wc = store.selectedWc;
  if (!wc) {
    container.innerHTML = '';
    return;
  }

  const semantic = getStatusSemantic(wc);
  const b = wc.score_breakdown || {
    cleanliness: 80,
    paper: 80,
    soap: 80,
    odor: 80,
    privacy: 80,
    condition: 80,
    price: 80
  };

  const totalReturnVotes = (wc.would_return_ratio?.yes || 1) + (wc.would_return_ratio?.no || 0);
  const yesPercent = Math.round(((wc.would_return_ratio?.yes || 1) / totalReturnVotes) * 100);

  container.innerHTML = `
    <div class="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <!-- Barra de Cabecera Modal con Drag Handle -->
        <div class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-5 pt-3 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rarity-badge ${wc.rarity}">${wc.rarity}</span>
            <span class="text-xs font-black text-amber-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              🎯 Dif: ${wc.difficulty}/10
            </span>
            ${wc.is_secret ? `<span class="bg-purple-900 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded-md">🔐 SECRETO</span>` : ''}
          </div>
          <button id="close-detail-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition">
            ✕
          </button>
        </div>

        <!-- Contenido Scrollable -->
        <div class="overflow-y-auto p-5 flex flex-col gap-4 text-slate-100">
          
          <!-- Título y Localización -->
          <div>
            <h1 class="text-xl font-black text-white leading-tight">${wc.name}</h1>
            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>📍</span> <span>${wc.address}, ${wc.city}</span>
            </p>
          </div>

          <!-- Dual Score Card: WC Score + Confidence -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">WC SCORE</span>
              <div class="text-3xl font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')} my-1">
                ${wc.score}<span class="text-xs text-slate-500 font-normal">/100</span>
              </div>
              <span class="text-[11px] font-bold text-slate-300">${wc.score >= 85 ? 'Excelente' : (wc.score >= 70 ? 'Aceptable' : 'Poco recomendable')}</span>
            </div>

            <div class="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 flex flex-col items-center text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">CONFIANZA VIGENTE</span>
              <div class="text-3xl font-black text-amber-400 my-1">
                ${wc.confidence}<span class="text-xs text-slate-500 font-normal">%</span>
              </div>
              <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full ${semantic.dotClass}"></span>
                <span>${formatRelativeTime(wc.last_verified_at)}</span>
              </span>
            </div>
          </div>

          <!-- Banner Crítico de Acceso -->
          <div class="bg-gradient-to-r from-amber-950/40 to-slate-800 border-2 border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">
                ${wc.access_type === 'free' ? '🆓' : (wc.access_type === 'customers_only' ? '🍔' : (wc.access_type === 'key_required' ? '🔑' : '💰'))}
              </span>
              <div>
                <span class="text-[10px] font-black text-amber-400 uppercase tracking-wider block">INFORMACIÓN DE ACCESO</span>
                <span class="text-sm font-black text-white">${wc.access_label}</span>
              </div>
            </div>
            <span class="text-xs text-slate-300 font-bold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
              ${wc.opening_hours}
            </span>
          </div>

          <!-- Personalidad Humorística del WC -->
          ${wc.personality_tag ? `
            <div class="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 flex items-start gap-2.5">
              <span class="text-xl flex-shrink-0">🎭</span>
              <div>
                <h4 class="text-xs font-black text-indigo-300 uppercase">${wc.personality_tag}</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed">${wc.personality_desc}</p>
              </div>
            </div>
          ` : ''}

          <!-- Desglose de Puntuación (Bar Chart) -->
          <div class="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex flex-col gap-2.5">
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider">Desglose de Calidad</h3>

            <div class="flex flex-col gap-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5 font-bold text-slate-300"><span>🧼</span> Limpieza</span>
                <span class="font-extrabold ${b.cleanliness >= 80 ? 'text-emerald-400' : 'text-amber-400'}">${b.cleanliness}</span>
              </div>
              <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width: ${b.cleanliness}%"></div>
              </div>

              <div class="flex items-center justify-between mt-1">
                <span class="flex items-center gap-1.5 font-bold text-slate-300"><span>🧻</span> Papel Higiénico</span>
                <span class="font-extrabold ${b.paper >= 80 ? 'text-emerald-400' : 'text-amber-400'}">${b.paper}</span>
              </div>
              <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full" style="width: ${b.paper}%"></div>
              </div>

              <div class="flex items-center justify-between mt-1">
                <span class="flex items-center gap-1.5 font-bold text-slate-300"><span>🧴</span> Jabón & Agua</span>
                <span class="font-extrabold text-slate-200">${b.soap}</span>
              </div>
              <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 rounded-full" style="width: ${b.soap}%"></div>
              </div>

              <div class="flex items-center justify-between mt-1">
                <span class="flex items-center gap-1.5 font-bold text-slate-300"><span>🔒</span> Privacidad</span>
                <span class="font-extrabold text-slate-200">${b.privacy}</span>
              </div>
              <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-purple-500 rounded-full" style="width: ${b.privacy}%"></div>
              </div>
            </div>
          </div>

          <!-- Métrica "¿Volverías a usarlo?" -->
          <div class="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-slate-300 uppercase tracking-wider">¿Volverías a usar este WC?</span>
              <span class="text-xs font-black text-emerald-400">👍 ${yesPercent}% Sí</span>
            </div>
            <div class="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700">
              <div class="bg-emerald-500 h-full" style="width: ${yesPercent}%"></div>
              <div class="bg-rose-500 h-full" style="width: ${100 - yesPercent}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>${wc.would_return_ratio?.yes || 1} cazadores volverían</span>
              <span>${wc.would_return_ratio?.no || 0} no volverían</span>
            </div>
          </div>

          <!-- WIDGET DE ACTUALIZACIÓN RÁPIDA (5 SEGUNDOS) -->
          <div id="quick-verify-section" class="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/60 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">⚡</span>
                <h3 class="text-sm font-black text-white">¿Cómo está ahora mismo?</h3>
              </div>
              <span class="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                +15 XP
              </span>
            </div>
            <p class="text-[11px] text-slate-400">Ayuda a la comunidad confirmando el estado en 5 segundos:</p>

            <form id="quick-verify-form" class="flex flex-col gap-3">
              <!-- Estado Abierto / Cerrado -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300">Estado</span>
                <div class="flex gap-1.5">
                  <button type="button" data-verif-status="open" class="verify-btn active">🟢 Abierto</button>
                  <button type="button" data-verif-status="closed" class="verify-btn">🔴 Cerrado</button>
                </div>
              </div>

              <!-- ¿Hay papel? -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300">¿Hay papel?</span>
                <div class="flex gap-1.5">
                  <button type="button" data-verif-paper="true" class="verify-btn ${wc.equipment.paper ? 'active' : ''}">✅ Sí</button>
                  <button type="button" data-verif-paper="false" class="verify-btn ${!wc.equipment.paper ? 'active' : ''}">❌ No</button>
                </div>
              </div>

              <!-- ¿Hay jabón? -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300">¿Hay jabón?</span>
                <div class="flex gap-1.5">
                  <button type="button" data-verif-soap="true" class="verify-btn ${wc.equipment.soap ? 'active' : ''}">✅ Sí</button>
                  <button type="button" data-verif-soap="false" class="verify-btn ${!wc.equipment.soap ? 'active' : ''}">❌ No</button>
                </div>
              </div>

              <!-- ¿Limpieza? -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300">Limpieza</span>
                <div class="flex gap-1.5">
                  <button type="button" data-verif-clean="clean" class="verify-btn active">🧼 Limpio</button>
                  <button type="button" data-verif-clean="normal" class="verify-btn">😐 Normal</button>
                  <button type="button" data-verif-clean="dirty" class="verify-btn">🤢 Sucio</button>
                </div>
              </div>

              <!-- ¿Volverías? -->
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300">¿Volverías?</span>
                <div class="flex gap-1.5">
                  <button type="button" data-verif-return="true" class="verify-btn active">👍 Sí</button>
                  <button type="button" data-verif-return="false" class="verify-btn">👎 No</button>
                </div>
              </div>

              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm py-3 rounded-2xl shadow-lg transition mt-2 flex items-center justify-center gap-2">
                <span>🛡️</span> <span>Confirmar Verificación (+15 XP)</span>
              </button>
            </form>
          </div>

          <!-- Galería de Fotos -->
          ${wc.photos && wc.photos.length > 0 ? `
            <div class="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex flex-col gap-2">
              <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider">Fotografías de la Comunidad</h3>
              <div class="grid grid-cols-2 gap-2 mt-1">
                ${wc.photos.map(p => `
                  <div class="relative rounded-xl overflow-hidden border border-slate-700 shadow aspect-video">
                    <img src="${p.url}" alt="${p.caption}" class="w-full h-full object-cover" />
                    <span class="absolute bottom-1 left-1 bg-slate-950/80 text-[9px] font-bold text-slate-200 px-1.5 py-0.5 rounded">
                      📸 ${formatRelativeTime(p.uploaded_at)}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Metadata de Descubridor -->
          <div class="text-center text-[11px] text-slate-500 py-2">
            Descubierto originalmente por <strong>@${wc.creator_name || 'Hunter'}</strong> · ${wc.reviews_count || 12} verificaciones registradas
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

  // Toggle visual states of verify buttons
  const form = container.querySelector('#quick-verify-form');
  if (form) {
    const attachGroup = (selector) => {
      const btns = form.querySelectorAll(selector);
      btns.forEach(b => {
        b.addEventListener('click', () => {
          btns.forEach(other => other.classList.remove('active'));
          b.classList.add('active');
        });
      });
    };

    attachGroup('[data-verif-status]');
    attachGroup('[data-verif-paper]');
    attachGroup('[data-verif-soap]');
    attachGroup('[data-verif-clean]');
    attachGroup('[data-verif-return]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const statusBtn = form.querySelector('[data-verif-status].active');
      const paperBtn = form.querySelector('[data-verif-paper].active');
      const soapBtn = form.querySelector('[data-verif-soap].active');
      const cleanBtn = form.querySelector('[data-verif-clean].active');
      const returnBtn = form.querySelector('[data-verif-return].active');

      const report = {
        status: statusBtn ? statusBtn.getAttribute('data-verif-status') : 'open',
        has_paper: paperBtn ? paperBtn.getAttribute('data-verif-paper') === 'true' : true,
        has_soap: soapBtn ? soapBtn.getAttribute('data-verif-soap') === 'true' : true,
        cleanliness: cleanBtn ? cleanBtn.getAttribute('data-verif-clean') : 'clean',
        would_return: returnBtn ? returnBtn.getAttribute('data-verif-return') === 'true' : true
      };

      store.verifyWC(wc.id, report);
      store.showToast('✅ ¡Verificación enviada! +15 XP ganados', 'success', 3500);
      renderWcDetailModal(container);
    });
  }
}
