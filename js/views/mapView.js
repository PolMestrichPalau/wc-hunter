/**
 * WC HUNTER — Vista Mapa Exploratorio V2.0
 * Vista visual "¿Dónde están?" con tarjeta preview al pulsar marcador.
 */
import { store } from '../state.js';
import { mapManager } from '../map.js';
import { getSemanticStatus, formatWouldReturn } from '../engines/wcEngine.js';

let previewWc = null;

export function renderMapView(container) {
  container.innerHTML = `
    <div class="relative w-full h-full flex flex-col overflow-hidden">
      
      <!-- Buscador Flotante Minimalista -->
      <div class="absolute top-4 inset-x-4 sm:left-6 sm:right-auto sm:w-96 z-[1000] pointer-events-none">
        <div class="bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-2xl p-2 flex items-center gap-2 border border-slate-800 pointer-events-auto transition">
          <span class="text-lg pl-2">🔎</span>
          <input
            id="map-search-input"
            type="text"
            placeholder="Buscar por ciudad, lugar o WC..."
            value="${store.searchQuery}"
            class="w-full bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          ${store.searchQuery ? `
            <button id="clear-search-btn" class="text-slate-400 hover:text-white p-1 font-bold text-xs">✕</button>
          ` : ''}
          <button id="map-quick-rescue-btn" class="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-md">
            <span>🚨</span>
            <span class="hidden sm:inline">Necesito WC</span>
          </button>
        </div>
      </div>

      <!-- Contenedor del Mapa Leaflet -->
      <div id="map-container" class="w-full flex-1 z-0"></div>

      <!-- Tarjeta Flotante Preview al Tocar un Marcador -->
      <div id="map-preview-drawer" class="absolute bottom-20 md:bottom-6 inset-x-4 max-w-md mx-auto z-[1000] transition-all duration-300 ${previewWc ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}">
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

  const rescueBtn = container.querySelector('#map-quick-rescue-btn');
  if (rescueBtn) {
    rescueBtn.addEventListener('click', () => {
      store.setTab('near');
    });
  }

  // Inicializar Leaflet con callback para abrir la tarjeta preview
  setTimeout(() => {
    if (!mapManager.initialized) {
      mapManager.init('map-container', (clickedWc) => {
        previewWc = clickedWc;
        const drawer = document.getElementById('map-preview-drawer');
        if (drawer) {
          drawer.innerHTML = renderPreviewCardHtml(clickedWc);
          drawer.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
          drawer.classList.add('translate-y-0', 'opacity-100');
          attachPreviewEvents(drawer);
        }
      });
    } else {
      mapManager.invalidate();
      mapManager.renderMarkers();
    }
  }, 50);

  const drawer = container.querySelector('#map-preview-drawer');
  if (drawer && previewWc) {
    attachPreviewEvents(drawer);
  }
}

function renderPreviewCardHtml(wc) {
  const semantic = getSemanticStatus(wc);
  const wouldRet = formatWouldReturn(wc.would_return_ratio);

  return `
    <div class="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="rarity-pill ${wc.rarity}">${wc.rarity}</span>
            ${wc.is_secret ? `<span class="text-[10px] font-black bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded">🔐 SECRETO</span>` : ''}
          </div>
          <h3 class="text-base font-black text-white truncate">${wc.name}</h3>
          <p class="text-xs text-slate-400 truncate mt-0.5">${wc.address}, ${wc.city}</p>
        </div>

        <div class="flex flex-col items-end flex-shrink-0">
          <div class="text-xl font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')} leading-none">
            ${wc.score}<span class="text-[10px] text-slate-500 font-normal">/100</span>
          </div>
          <span class="text-[10px] text-slate-400 font-bold mt-1">🛡️ ${wc.confidence}% conf.</span>
        </div>
      </div>

      <!-- Datos Clave Rápidos -->
      <div class="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <span class="font-black ${semantic.color === 'green' ? 'text-emerald-400' : (semantic.color === 'red' ? 'text-rose-400' : 'text-amber-400')}">
          ${semantic.label}
        </span>
        <span>·</span>
        <span class="font-bold text-amber-300">${wc.access_label}</span>
        <span>·</span>
        <span class="text-emerald-400 font-bold">👍 ${wouldRet.percent}% volvería</span>
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center gap-2">
        <button id="preview-open-sheet-btn" class="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5">
          <span>📋</span>
          <span>Ver Ficha y Detalles</span>
        </button>
        <button id="preview-dismiss-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs p-2.5 rounded-xl transition">
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
    });
  }
}
