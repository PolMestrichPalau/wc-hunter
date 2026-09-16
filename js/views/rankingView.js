/**
 * WC HUNTER — Vista Rankings (Pestaña 3)
 */
import { store } from '../state.js';
import { TOP_HUNTERS_LEADERBOARD } from '../seedData.js';

let activeRankingTab = 'wcs'; // 'wcs' | 'hunters'
let wcFilter = 'best'; // 'best' | 'cleanest' | 'free' | 'secrets' | 'worst'

export function renderRankingView(container) {
  const wcs = [...store.wcs];

  // Ordenar WCs según subfiltro
  let sortedWcs = [...wcs];
  if (wcFilter === 'best') {
    sortedWcs.sort((a, b) => b.score - a.score);
  } else if (wcFilter === 'cleanest') {
    sortedWcs.sort((a, b) => (b.score_breakdown?.cleanliness || 0) - (a.score_breakdown?.cleanliness || 0));
  } else if (wcFilter === 'free') {
    sortedWcs = sortedWcs.filter(w => w.access_type === 'free' || w.price === 0);
    sortedWcs.sort((a, b) => b.score - a.score);
  } else if (wcFilter === 'secrets') {
    sortedWcs = sortedWcs.filter(w => w.is_secret);
    sortedWcs.sort((a, b) => b.score - a.score);
  } else if (wcFilter === 'worst') {
    sortedWcs.sort((a, b) => a.score - b.score); // El Muro de la Infamia
  }

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto pb-24">
      <!-- Cabecera y Switch de Pestañas -->
      <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-xl font-black text-white flex items-center gap-2">
            <span>🏆</span> <span>Rankings de la Comunidad</span>
          </h1>
          <span class="text-xs text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
            Temporada 1
          </span>
        </div>

        <div class="flex p-1 bg-slate-800 rounded-xl border border-slate-700/60">
          <button id="rank-tab-wcs" class="flex-1 py-2 text-xs font-black rounded-lg transition ${activeRankingTab === 'wcs' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'}">
            🚽 Top WC
          </button>
          <button id="rank-tab-hunters" class="flex-1 py-2 text-xs font-black rounded-lg transition ${activeRankingTab === 'hunters' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'}">
            🌍 Top Hunters
          </button>
        </div>

        ${activeRankingTab === 'wcs' ? `
          <!-- Subfiltros de WCs -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
            <button data-wc-filter="best" class="intent-pill ${wcFilter === 'best' ? 'active' : ''}">⭐ Más Top</button>
            <button data-wc-filter="cleanest" class="intent-pill ${wcFilter === 'cleanest' ? 'active' : ''}">🧼 Más Limpios</button>
            <button data-wc-filter="free" class="intent-pill ${wcFilter === 'free' ? 'active' : ''}">🆓 Mejores Gratis</button>
            <button data-wc-filter="secrets" class="intent-pill ${wcFilter === 'secrets' ? 'active' : ''}">🔐 Top Secretos</button>
            <button data-wc-filter="worst" class="intent-pill ${wcFilter === 'worst' ? 'active bg-rose-600/30 border-rose-500 text-rose-300' : ''}">🏚️ Muro Infamia</button>
          </div>
        ` : ''}
      </div>

      <!-- Contenido: WCs o Hunters -->
      <div class="p-4 flex flex-col gap-3">
        ${activeRankingTab === 'wcs' ? (
          sortedWcs.map((wc, idx) => {
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            return `
              <div class="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow hover:border-slate-600 transition cursor-pointer ranking-wc-item" data-wc-id="${wc.id}">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-lg font-black text-amber-400 w-7 text-center">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="rarity-badge ${wc.rarity}">${wc.rarity}</span>
                      ${wc.is_secret ? `<span class="text-[10px] font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded">🔐</span>` : ''}
                      <span class="text-[11px] text-slate-400 font-semibold">${wc.city}</span>
                    </div>
                    <h3 class="text-sm font-black text-white truncate">${wc.name}</h3>
                    <p class="text-xs text-amber-300/90 font-medium truncate">${wc.access_label}</p>
                  </div>
                </div>

                <div class="flex flex-col items-end flex-shrink-0">
                  <div class="text-base font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')}">
                    ${wc.score}<span class="text-[10px] text-slate-400 font-normal">/100</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-semibold">🛡️ ${wc.confidence}%</span>
                </div>
              </div>
            `;
          }).join('')
        ) : (
          TOP_HUNTERS_LEADERBOARD.map((hunter, idx) => {
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            const isMe = hunter.name.includes('(Tú)');
            return `
              <div class="bg-slate-800/90 border ${isMe ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-700/80'} rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-lg font-black text-amber-400 w-7 text-center">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <h3 class="text-sm font-black ${isMe ? 'text-amber-300' : 'text-white'} truncate">${hunter.name}</h3>
                      <span class="text-[10px] text-slate-400 font-bold bg-slate-700 px-1.5 py-0.5 rounded">${hunter.city}</span>
                    </div>
                    <p class="text-xs text-amber-400 font-bold truncate">${hunter.title}</p>
                    <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                      <span>🔎 ${hunter.discovered} descubiertos</span>
                      <span>•</span>
                      <span>⚡ ${hunter.verifs} verifs</span>
                      <span>•</span>
                      <span>🛡️ ${hunter.rep}%</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-end flex-shrink-0">
                  <span class="text-sm font-black text-amber-400">${hunter.xp.toLocaleString()}</span>
                  <span class="text-[10px] text-slate-400 font-bold uppercase">XP TOTAL</span>
                </div>
              </div>
            `;
          }).join('')
        )}
      </div>
    </div>
  `;

  // Attach event listeners
  const wcsTabBtn = container.querySelector('#rank-tab-wcs');
  const huntersTabBtn = container.querySelector('#rank-tab-hunters');

  if (wcsTabBtn) {
    wcsTabBtn.addEventListener('click', () => {
      activeRankingTab = 'wcs';
      renderRankingView(container);
    });
  }

  if (huntersTabBtn) {
    huntersTabBtn.addEventListener('click', () => {
      activeRankingTab = 'hunters';
      renderRankingView(container);
    });
  }

  const wcFilterButtons = container.querySelectorAll('[data-wc-filter]');
  wcFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      wcFilter = btn.getAttribute('data-wc-filter');
      renderRankingView(container);
    });
  });

  const wcItems = container.querySelectorAll('.ranking-wc-item');
  wcItems.forEach(item => {
    item.addEventListener('click', () => {
      const wcId = item.getAttribute('data-wc-id');
      store.openWcDetail(wcId);
    });
  });
}
