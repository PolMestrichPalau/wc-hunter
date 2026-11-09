/**
 * WC HUNTER — Vista Mapa Exploratorio V2.0
 * Vista visual "¿Dónde están?" con tarjeta preview al pulsar marcador y Botón de Pánico flotante destacado.
 */
import { store } from '../state.js';
import { mapManager } from '../map.js';
import { getSemanticStatus, formatWouldReturn } from '../engines/wcEngine.js';

let previewWc = null;

export function renderMapView(container) {
  const currentFilter = store.intentFilter || 'any';

  container.innerHTML = `
    <div class="relative w-full h-full flex flex-col overflow-hidden bg-surface">
      
      <!-- Header Flotante Táctico: Buscador + Filtros Rápidos + Botón Descubrir WC -->
      <div class="absolute top-3 inset-x-3 sm:left-6 sm:right-auto sm:w-[480px] z-[1000] pointer-events-none flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="bg-surface-container/90 backdrop-blur-md shadow-2xl rounded-2xl p-2.5 flex items-center gap-2.5 border border-white/10 pointer-events-auto transition flex-1">
            <span class="text-base pl-2 text-slate-400">🔎</span>
            <input
              id="map-search-input"
              type="text"
              placeholder="Buscar baños, zonas o calles..."
              value="${store.searchQuery}"
              class="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            ${store.searchQuery ? `
              <button id="clear-search-btn" class="text-slate-400 hover:text-white p-1 font-bold text-xs">✕</button>
            ` : ''}
          </div>
          <button
            id="map-add-wc-btn"
            class="tactile-amber-btn bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs px-3.5 py-3 rounded-2xl shadow-xl flex items-center gap-1.5 pointer-events-auto flex-shrink-0"
            title="Descubrir Nuevo WC (+50 XP)"
          >
            <span class="text-sm">➕</span>
            <span class="hidden sm:inline font-black">Nuevo (+50 XP)</span>
          </button>
        </div>

        <!-- Píldoras Horizontales de Filtros Rápidos (Stitch Screen 1) -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
          <button class="map-filter-chip ${currentFilter === 'any' ? 'active' : ''}" data-filter="any">
            Todos
          </button>
          <button class="map-filter-chip ${currentFilter === 'clean' ? 'active' : ''}" data-filter="clean">
            ⭐ Limpios
          </button>
          <button class="map-filter-chip ${currentFilter === 'free' ? 'active' : ''}" data-filter="free">
            🆓 Gratis
          </button>
          <button class="map-filter-chip ${currentFilter === 'equipped' ? 'active' : ''}" data-filter="equipped">
            🧻 Equipados
          </button>
          <button class="map-filter-chip ${currentFilter === 'baby' ? 'active' : ''}" data-filter="baby">
            🚼 Bebé
          </button>
          <button class="map-filter-chip ${currentFilter === 'accessible' ? 'active' : ''}" data-filter="accessible">
            ♿ Accesible
          </button>
        </div>
      </div>

      <!-- Contenedor del Mapa Leaflet Pinned Fullscreen -->
      <div id="map-container" class="absolute inset-0 w-full h-full z-0"></div>

      <!-- BOTÓN DE PÁNICO FLOTANTE DE ALTA VISIBILIDAD (Stitch Specification) -->
      <div class="panic-floating-wrapper ${previewWc ? 'hidden' : ''}">
        <button
          id="floating-panic-btn"
          class="tactile-panic-btn font-black text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-[0_0_24px_rgba(239,68,68,0.55)] flex items-center gap-2.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white border-2 border-red-300/40 active:scale-95 transition-all"
        >
          <span class="text-xl animate-bounce">🚨</span>
          <span class="tracking-wider">¡URGENCIA! BAÑO MÁS PRÓXIMO</span>
        </button>
      </div>

      <!-- Tarjeta Flotante Preview al Tocar un Marcador -->
      <div id="map-preview-drawer" class="preview-drawer-wrapper transition-all duration-300 ${previewWc ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}">
        ${previewWc ? renderPreviewCardHtml(previewWc) : ''}
      </div>
    </div>
  `;

  // Attach search listeners
  const searchInput = container.querySelector('#map-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.setSearchQuery(e.target.value);
      mapManager.renderMarkers();
    });
  }

  const clearBtn = container.querySelector('#clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.setSearchQuery('');
      mapManager.renderMarkers();
      renderMapView(container);
    });
  }

  // Filter chips listeners
  const filterChips = container.querySelectorAll('.map-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const f = chip.getAttribute('data-filter');
      store.setIntentFilter(f === 'any' ? null : f);
      mapManager.renderMarkers();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Event listener del botón añadir WC en mapa
  const addBtn = container.querySelector('#map-add-wc-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      store.openAddModal();
    });
  }

  // Event listener del botón flotante de pánico
  const panicBtn = container.querySelector('#floating-panic-btn');
  if (panicBtn) {
    panicBtn.addEventListener('click', () => {
      store.setTab('near');
    });
  }

  // Inicializar Leaflet sobre el contenedor activo
  setTimeout(() => {
    mapManager.init('map-container', (clickedWc) => {
      previewWc = clickedWc;
      const drawer = document.getElementById('map-preview-drawer');
      const pWrapper = document.querySelector('.panic-floating-wrapper');
      if (pWrapper) pWrapper.classList.add('hidden');
      if (drawer) {
        drawer.innerHTML = renderPreviewCardHtml(clickedWc);
        drawer.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-y-0', 'opacity-100');
        attachPreviewEvents(drawer);
      }
    });
    mapManager.invalidate();
    mapManager.renderMarkers();
  }, 50);

  const drawer = container.querySelector('#map-preview-drawer');
  if (drawer && previewWc) {
    attachPreviewEvents(drawer);
  }
}

function renderPreviewCardHtml(wc) {
  const semantic = getSemanticStatus(wc);
  const wouldRet = formatWouldReturn(wc.would_return_ratio);
  const b = wc.score_breakdown || { cleanliness: 90, privacy: 85 };

  return `
    <div class="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 animate-slide-up">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="rarity-pill ${wc.rarity}">${wc.rarity}</span>
            <span class="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>📍</span> <span>140 m · 2 min</span>
            </span>
            ${wc.is_secret ? `<span class="text-[10px] font-black bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">🔐 SECRETO</span>` : ''}
          </div>
          <h3 class="text-base font-extrabold text-white truncate leading-snug">${wc.name}</h3>
          <p class="text-xs text-slate-400 truncate mt-0.5">${wc.address}, ${wc.city}</p>
        </div>

        <div class="flex flex-col items-center flex-shrink-0">
          <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-base shadow-lg ${wc.score >= 85 ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-emerald-500/20' : (wc.score >= 70 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-500/20')}">
            <span>${wc.score}</span>
            <span class="text-[8px] font-bold uppercase tracking-wider opacity-80 leading-none">SCORE</span>
          </div>
        </div>
      </div>

      <!-- Métricas de 4 Pilares Express (Stitch UI) -->
      <div class="grid grid-cols-3 gap-2 text-[11px] font-bold text-slate-300 bg-slate-950/80 p-2.5 rounded-2xl border border-white/5">
        <div class="flex flex-col items-center text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">ESTADO</span>
          <span class="font-extrabold mt-0.5 ${semantic.color === 'green' ? 'text-emerald-400' : (semantic.color === 'red' ? 'text-rose-400' : 'text-amber-400')}">
            ${semantic.label}
          </span>
        </div>
        <div class="flex flex-col items-center text-center border-x border-slate-800">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">ACCESO</span>
          <span class="font-extrabold text-amber-300 mt-0.5 truncate max-w-full px-1">
            ${wc.access_label}
          </span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">VOLVERÍA</span>
          <span class="font-extrabold text-emerald-400 mt-0.5">
            👍 ${wouldRet.percent}%
          </span>
        </div>
      </div>

      <!-- Botones de Acción Táctiles -->
      <div class="flex items-center gap-2">
        <button id="preview-open-sheet-btn" class="tactile-btn flex-1 bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
          <span>📋</span>
          <span>Ver Ficha y Validar (+15 XP)</span>
        </button>
        <button id="preview-dismiss-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs px-3.5 py-3 rounded-2xl border border-white/10 transition" title="Cerrar">
          ✕
        </button>
      </div>
    </div>
  `;
}

function attachPreviewEvents(drawer) {
  const openBtn = drawer.querySelector('#preview-open-sheet-btn');
  if (openBtn && previewWc) {
    openBtn.addEventListener('click', () => {
      store.openWcDetail(previewWc.id);
    });
  }

  const dismissBtn = drawer.querySelector('#preview-dismiss-btn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      previewWc = null;
      drawer.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
      drawer.classList.remove('translate-y-0', 'opacity-100');
      const pWrapper = document.querySelector('.panic-floating-wrapper');
      if (pWrapper) pWrapper.classList.remove('hidden');
    });
  }
}
