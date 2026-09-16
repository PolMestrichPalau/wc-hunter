/**
 * WC HUNTER — Vista Mapa (Pestaña 1)
 */
import { store } from '../state.js';
import { mapManager } from '../map.js';

export function renderMapView(container) {
  const isEmergency = store.emergencyMode;
  const currentIntent = store.intentFilter;

  container.innerHTML = `
    <div class="relative w-full h-full flex flex-col overflow-hidden">
      <!-- Barra Superior Flotante -->
      <div class="absolute top-3 inset-x-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        <!-- Buscador con Glassmorphism -->
        <div class="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-2.5 flex items-center gap-2.5 border border-slate-200 pointer-events-auto transition-all">
          <span class="text-xl pl-1">🔎</span>
          <input
            id="map-search-input"
            type="text"
            placeholder="Buscar WC, ciudad o lugar..."
            value="${store.searchQuery}"
            class="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          ${store.searchQuery ? `
            <button id="clear-search-btn" class="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold">✕</button>
          ` : ''}
          <button id="open-add-wc-btn" class="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm transition active:scale-95 whitespace-nowrap">
            <span>➕</span> <span>Añadir</span>
          </button>
        </div>

        <!-- Filtros Rápidos de Intención (Pills scrolleables) -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          <button data-intent="clean" class="intent-pill ${currentIntent === 'clean' ? 'active' : ''}">
            🧼 Limpio
          </button>
          <button data-intent="free" class="intent-pill ${currentIntent === 'free' ? 'active' : ''}">
            🆓 Gratis
          </button>
          <button data-intent="private" class="intent-pill ${currentIntent === 'private' ? 'active' : ''}">
            🔒 Privado
          </button>
          <button data-intent="secret" class="intent-pill ${currentIntent === 'secret' ? 'active' : ''}">
            🔐 Secretos
          </button>
          <button data-intent="baby" class="intent-pill ${currentIntent === 'baby' ? 'active' : ''}">
            👶 Con Cambiador
          </button>
          <button data-intent="accessible" class="intent-pill ${currentIntent === 'accessible' ? 'active' : ''}">
            ♿ Accesible
          </button>
        </div>
      </div>

      <!-- Contenedor del Mapa Leaflet -->
      <div id="map-container" class="w-full flex-1 z-0"></div>

      <!-- Botón Flotante Emergencia "🚨 NECESITO WC" -->
      <div class="absolute bottom-4 inset-x-4 z-[1000] flex justify-center pointer-events-none">
        <button
          id="emergency-floating-btn"
          class="pointer-events-auto bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-base px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-rose-300 animate-bounce transition"
          style="box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.5);"
        >
          <span class="text-2xl animate-pulse">🚨</span>
          <span class="tracking-wider">NECESITO WC AHORA</span>
        </button>
      </div>
    </div>
  `;

  // Attach event listeners
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

  const addBtn = container.querySelector('#open-add-wc-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => store.openAddModal());
  }

  const intentButtons = container.querySelectorAll('[data-intent]');
  intentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const intent = btn.getAttribute('data-intent');
      store.setIntentFilter(intent);
      mapManager.renderMarkers();
      renderMapView(container);
    });
  });

  const emergBtn = container.querySelector('#emergency-floating-btn');
  if (emergBtn) {
    emergBtn.addEventListener('click', () => store.toggleEmergencyMode());
  }

  // Inicializar o refrescar mapa
  setTimeout(() => {
    if (!mapManager.initialized) {
      mapManager.init('map-container');
    } else {
      mapManager.invalidate();
      mapManager.renderMarkers();
    }
  }, 50);
}
