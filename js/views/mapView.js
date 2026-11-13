/**
 * WC HUNTER — Vista Mapa Exploratorio V2.0
 * Vista visual "¿Dónde están?" con tarjeta preview al pulsar marcador y Botón de Pánico flotante destacado.
 */
import { store } from '../state.js';
import { mapManager } from '../map.js';
import { CITIES_QUICK_JUMP } from '../seedData.js';
import { getSemanticStatus, formatWouldReturn, calculateDistanceMeters, formatDistance, formatWalkTime } from '../engines/wcEngine.js';
import { esc } from '../utils.js';

let previewWc = null;

export function setMapPreviewWc(wc) {
  previewWc = wc || null;
}

export function renderMapView(container) {
  const currentFilter = store.intentFilter || 'any';
  const activeCity = (store.userLocation?.city || 'Madrid').toLowerCase();

  container.innerHTML = `
    <div class="relative w-full h-full flex flex-col overflow-hidden bg-surface">
      
      <!-- Header Flotante Táctico: Buscador + Filtros Rápidos + Selector de Ciudad / GPS -->
      <div class="absolute top-3 inset-x-3 sm:left-6 sm:right-auto sm:w-[520px] z-[1000] pointer-events-none flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="bg-surface-container/90 backdrop-blur-md shadow-2xl rounded-2xl p-2.5 flex items-center gap-2.5 border border-white/10 pointer-events-auto transition flex-1">
            <span class="text-base pl-2 text-slate-400">🔎</span>
            <input
              id="map-search-input"
              type="text"
              placeholder="Buscar baños, zonas, códigos o calles..."
              value="${esc(store.searchQuery)}"
              maxlength="80"
              class="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button id="clear-search-btn" class="text-slate-400 hover:text-white p-1 font-bold text-xs ${store.searchQuery ? '' : 'hidden'}" aria-label="Borrar búsqueda">✕</button>
          </div>
          <button
            id="map-locate-btn"
            class="bg-surface-container/95 hover:bg-slate-800 text-emerald-400 font-black text-xs px-3 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-1 pointer-events-auto flex-shrink-0 transition active:scale-95"
            title="Centrar en mi ubicación GPS"
          >
            <span class="text-sm">🎯</span>
            <span class="hidden sm:inline font-extrabold">Mi GPS</span>
          </button>
          <button
            id="map-add-wc-btn"
            class="tactile-amber-btn bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs px-3.5 py-3 rounded-2xl shadow-xl flex items-center gap-1.5 pointer-events-auto flex-shrink-0"
            title="Check-in o descubrir un WC nuevo"
          >
            <span class="text-sm">📍</span>
            <span class="font-black">Estoy aquí</span>
          </button>
        </div>

        <!-- Píldoras Horizontales de Filtros Rápidos (Stitch Screen 1) -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-0.5">
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
          <button class="map-filter-chip ${currentFilter === 'secret' ? 'active' : ''}" data-filter="secret">
            🔐 Secretos
          </button>
          <button class="map-filter-chip ${currentFilter === 'favorites' ? 'active' : ''}" data-filter="favorites">
            ❤️ Favoritos
          </button>
          <button class="map-filter-chip ${currentFilter === 'baby' ? 'active' : ''}" data-filter="baby">
            🚼 Bebé
          </button>
          <button class="map-filter-chip ${currentFilter === 'accessible' ? 'active' : ''}" data-filter="accessible">
            ♿ Accesible
          </button>
        </div>

        <!-- Selector Rápido de Ciudades Radar -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 px-2 py-1 rounded-lg border border-white/5 flex-shrink-0">
            🏙️ Radar:
          </span>
          ${CITIES_QUICK_JUMP.map(c => `
            <button
              type="button"
              data-city-jump="${esc(c.id)}"
              class="text-[11px] font-extrabold px-2.5 py-1 rounded-xl border transition flex-shrink-0 ${activeCity.includes(c.id) ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow' : 'bg-slate-900/85 border-white/10 text-slate-300 hover:text-white'}"
            >
              ${esc(c.name)}
            </button>
          `).join('')}
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
      const cb = container.querySelector('#clear-search-btn');
      if (cb) cb.classList.toggle('hidden', !store.searchQuery);
      mapManager.renderMarkers();
    });
  }

  const clearBtn = container.querySelector('#clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      store.setSearchQuery('');
      if (searchInput) searchInput.value = '';
      clearBtn.classList.add('hidden');
      mapManager.renderMarkers();
    });
  }

  // Filter chips listeners
  const filterChips = container.querySelectorAll('.map-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const f = chip.getAttribute('data-filter');
      store.setIntentFilter(f === 'any' ? null : f);
      mapManager.renderMarkers();
      // El estado visual refleja siempre el filtro real del store
      const active = store.intentFilter || 'any';
      filterChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-filter') === active));
    });
  });

  // Event listener del botón Mi GPS
  const locateBtn = container.querySelector('#map-locate-btn');
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      mapManager.locateUser();
    });
  }

  // Selector rápido de ciudades
  const cityBtns = container.querySelectorAll('[data-city-jump]');
  cityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cid = btn.getAttribute('data-city-jump');
      const cityObj = CITIES_QUICK_JUMP.find(c => c.id === cid);
      if (cityObj) {
        mapManager.jumpToCity(cityObj);
        cityBtns.forEach(b => {
          const isAct = b.getAttribute('data-city-jump') === cid;
          b.className = `text-[11px] font-extrabold px-2.5 py-1 rounded-xl border transition flex-shrink-0 ${isAct ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow' : 'bg-slate-900/85 border-white/10 text-slate-300 hover:text-white'}`;
        });
        if (previewWc) {
          const drawer = document.getElementById('map-preview-drawer');
          if (drawer) {
            drawer.innerHTML = renderPreviewCardHtml(previewWc);
            attachPreviewEvents(drawer);
          }
        }
      }
    });
  });

  // Event listener del botón añadir WC en mapa
  const addBtn = container.querySelector('#map-add-wc-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      store.openCheckin();
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
  const uLoc = store.userLocation;
  const meters = calculateDistanceMeters(uLoc.lat, uLoc.lng, wc.latitude, wc.longitude);
  const distLabel = [formatDistance(meters), formatWalkTime(meters)].filter(Boolean).join(' · ');
  const isFav = store.isFavorite(wc.id);
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(wc.latitude)},${encodeURIComponent(wc.longitude)}&travelmode=walking`;

  return `
    <div class="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 animate-slide-up">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="rarity-pill ${esc(wc.rarity)}">${esc(wc.rarity)}</span>
            <span class="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>📍</span> <span>${esc(distLabel)}</span>
            </span>
            ${wc.is_secret ? `<span class="text-[10px] font-black bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">🔐 SECRETO</span>` : ''}
          </div>
          <h3 class="text-base font-extrabold text-white truncate leading-snug">${esc(wc.name)}</h3>
          <p class="text-xs text-slate-400 truncate mt-0.5">${esc(wc.address)}, ${esc(wc.city)}</p>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button id="preview-fav-btn" class="w-10 h-10 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border ${isFav ? 'border-rose-500/60 text-rose-400' : 'border-white/10 text-slate-400'} flex items-center justify-center text-base transition active:scale-90" title="${isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-base shadow-lg ${wc.unrated ? 'bg-slate-700 text-slate-200' : (wc.score >= 85 ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 shadow-emerald-500/20' : (wc.score >= 70 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-amber-500/20' : 'bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-rose-500/20'))}">
            <span>${wc.unrated ? '?' : esc(wc.score)}</span>
            <span class="text-[8px] font-bold uppercase tracking-wider opacity-80 leading-none">SCORE</span>
          </div>
        </div>
      </div>

      ${(wc.hunter_tip || wc.access_code) ? `
        <div class="bg-amber-950/35 border border-amber-500/30 rounded-2xl px-3 py-2 text-[11px] text-amber-200 flex items-center gap-2">
          <span class="text-sm flex-shrink-0">💡</span>
          <span class="truncate font-semibold">${wc.access_code ? `<strong class="text-amber-400">[${esc(wc.access_code)}]</strong> ` : ''}${esc(wc.hunter_tip || wc.personality_desc)}</span>
        </div>
      ` : ''}

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
            ${esc(wc.access_label)}
          </span>
        </div>
        <div class="flex flex-col items-center text-center">
          <span class="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">VOLVERÍA</span>
          <span class="font-extrabold text-emerald-400 mt-0.5">
            ${wouldRet.total > 0 ? `👍 ${wouldRet.percent}%` : '—'}
          </span>
        </div>
      </div>

      <!-- Botones de Acción Táctiles -->
      <div class="flex items-center gap-2">
        <button id="preview-open-sheet-btn" class="tactile-btn flex-1 bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs py-3 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5">
          <span>📋</span>
          <span>Ficha y Validar (+15 XP)</span>
        </button>
        <a href="${esc(navUrl)}" target="_blank" rel="noopener" class="tactile-cyan-btn bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-black text-xs py-3 px-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 flex-shrink-0" title="Abrir ruta a pie en Google Maps">
          <span>🧭</span>
          <span>Ir</span>
        </a>
        <button id="preview-dismiss-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs px-3 py-3 rounded-2xl border border-white/10 transition flex-shrink-0" title="Cerrar">
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

  const favBtn = drawer.querySelector('#preview-fav-btn');
  if (favBtn && previewWc) {
    favBtn.addEventListener('click', () => {
      store.toggleFavorite(previewWc.id);
      drawer.innerHTML = renderPreviewCardHtml(previewWc);
      attachPreviewEvents(drawer);
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
