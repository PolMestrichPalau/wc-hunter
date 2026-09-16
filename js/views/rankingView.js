/**
 * WC HUNTER — Vista Rankings V2.0
 */
import { store } from '../state.js';
import { TOP_HUNTERS_LEADERBOARD } from '../seedData.js';

let activeRankingTab = 'wcs';
let wcFilter = 'best';

export function renderRankingView(container) {
  const wcs = [...store.wcs];

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
    sortedWcs.sort((a, b) => a.score - b.score);
  }

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      <!-- Cabecera -->
      <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 pt-5 pb-4 border-b border-slate-800/80 shadow-md">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>🏆</span> <span>RANKINGS DE LA COMUNIDAD</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Compara los mejores y peores WC y el Top Hunters</p>
          </div>
          <span class="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
            Temporada 1
          </span>
        </div>

        <!-- Switch WCs / Hunters -->
        <div class="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 max-w-md">
          <button id="rank-tab-wcs" class="flex-1 py-2 text-xs font-black rounded-xl transition ${activeRankingTab === 'wcs' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}">
            🚽 Top WC
          </button>
          <button id="rank-tab-hunters" class="flex-1 py-2 text-xs font-black rounded-xl transition ${activeRankingTab === 'hunters' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}">
            🌍 Top Hunters
          </button>
        </div>

        ${activeRankingTab === 'wcs' ? `
          <!-- Subfiltros de WC -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
            <button data-wc-filter="best" class="big-intent-btn text-xs py-2 px-3 ${wcFilter === 'best' ? 'active' : ''}">⭐ Más Top</button>
            <button data-wc-filter="cleanest" class="big-intent-btn text-xs py-2 px-3 ${wcFilter === 'cleanest' ? 'active' : ''}">🧼 Más Limpios</button>
            <button data-wc-filter="free" class="big-intent-btn text-xs py-2 px-3 ${wcFilter === 'free' ? 'active' : ''}">🆓 Mejores Gratis</button>
            <button data-wc-filter="secrets" class="big-intent-btn text-xs py-2 px-3 ${wcFilter === 'secrets' ? 'active' : ''}">🔐 Top Secretos</button>
            <button data-wc-filter="worst" class="big-intent-btn text-xs py-2 px-3 ${wcFilter === 'worst' ? 'panic-active' : ''}">🏚️ Muro de la Infamia</button>
          </div>
        ` : ''}
      </div>

      <!-- Contenido -->
      <div class="px-4 sm:px-6 py-5 flex flex-col gap-3 max-w-4xl mx-auto w-full">
        ${activeRankingTab === 'wcs' ? (
          sortedWcs.map((wc, idx) => {
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            return `
              <div class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3 shadow transition cursor-pointer rank-wc-card" data-wc-id="${wc.id}">
                <div class="flex items-center gap-3.5 min-w-0">
                  <span class="text-xl font-black text-amber-400 w-8 text-center flex-shrink-0">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 mb-1">
                      <span class="rarity-pill ${wc.rarity}">${wc.rarity}</span>
                      ${wc.is_secret ? `<span class="text-[10px] font-black bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded">🔐</span>` : ''}
                      <span class="text-xs text-slate-400 font-semibold truncate">${wc.city}</span>
                    </div>
                    <h3 class="text-sm font-black text-white truncate">${wc.name}</h3>
                    <p class="text-xs text-amber-300/90 font-medium truncate mt-0.5">${wc.access_label}</p>
                  </div>
                </div>

                <div class="flex flex-col items-end flex-shrink-0">
                  <div class="text-lg font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')} leading-none">
                    ${wc.score}<span class="text-[10px] text-slate-500 font-normal">/100</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-semibold mt-1">🛡️ ${wc.confidence}%</span>
                </div>
              </div>
            `;
          }).join('')
        ) : (
          TOP_HUNTERS_LEADERBOARD.map((hunter, idx) => {
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            const isMe = hunter.name.includes('(Tú)');
            return `
              <div class="bg-slate-900/90 border ${isMe ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-800'} rounded-2xl p-4 flex items-center justify-between gap-3 shadow">
                <div class="flex items-center gap-3.5 min-w-0">
                  <span class="text-xl font-black text-amber-400 w-8 text-center flex-shrink-0">${medal}</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-black ${isMe ? 'text-amber-300' : 'text-white'} truncate">${hunter.name}</h3>
                      <span class="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-lg">${hunter.city}</span>
                    </div>
                    <p class="text-xs text-amber-400 font-bold truncate mt-0.5">${hunter.title}</p>
                    <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
                      <span>🔎 ${hunter.discovered} descubiertos</span>
                      <span>·</span>
                      <span>⚡ ${hunter.verifs} verifs</span>
                      <span>·</span>
                      <span>🛡️ ${hunter.rep}% rep.</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-end flex-shrink-0">
                  <span class="text-sm font-black text-amber-400">${hunter.xp.toLocaleString()}</span>
                  <span class="text-[9px] text-slate-500 font-bold uppercase">XP TOTAL</span>
                </div>
              </div>
            `;
          }).join('')
        )}
      </div>
    </div>
  `;

  // Attach event listeners
  const wcsTab = container.querySelector('#rank-tab-wcs');
  const huntersTab = container.querySelector('#rank-tab-hunters');

  if (wcsTab) {
    wcsTab.addEventListener('click', () => {
      activeRankingTab = 'wcs';
      renderRankingView(container);
    });
  }

  if (huntersTab) {
    huntersTab.addEventListener('click', () => {
      activeRankingTab = 'hunters';
      renderRankingView(container);
    });
  }

  const filters = container.querySelectorAll('[data-wc-filter]');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      wcFilter = btn.getAttribute('data-wc-filter');
      renderRankingView(container);
    });
  });

  const cards = container.querySelectorAll('.rank-wc-card');
  cards.forEach(c => {
    c.addEventListener('click', () => {
      const wcId = c.getAttribute('data-wc-id');
      store.openWcDetail(wcId);
    });
  });
}
