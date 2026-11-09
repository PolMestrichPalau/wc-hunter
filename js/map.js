/**
 * WC HUNTER — Módulo de Mapa Minimalista Leaflet V2.1
 * Marcadores ultra-visuales y limpios: "¿Dónde están?"
 */
import { store } from './state.js';
import { getSemanticStatus } from './engines/wcEngine.js';
import { esc } from './utils.js';
import { reverseGeocode } from './geo.js';

class MapManager {
  constructor() {
    this.map = null;
    this.markersLayer = null;
    this.userMarker = null;
    this.initialized = false;
    this.onMarkerClickCallback = null;
    this.lastView = null; // vista (centro/zoom) para no perderla al cambiar de pestaña
  }

  /** Guarda la vista y destruye el mapa (al salir de la pestaña Mapa) */
  destroy() {
    if (!this.map) return;
    try {
      this.lastView = { center: this.map.getCenter(), zoom: this.map.getZoom() };
      this.map.remove();
    } catch (e) {}
    this.map = null;
    this.markersLayer = null;
    this.userMarker = null;
    this.initialized = false;
  }

  init(containerId = 'map-container', onMarkerClick = null) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!window.L) {
      // Reintentar si la librería Leaflet todavía está descargándose por red
      if ((this._retryCount || 0) < 30) {
        this._retryCount = (this._retryCount || 0) + 1;
        setTimeout(() => this.init(containerId, onMarkerClick), 100);
        return;
      }

      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#0b1326;color:#94a3b8;text-align:center;padding:24px;gap:12px;">
          <span style="font-size:48px;">🗺️</span>
          <p style="font-size:13px;font-weight:800;color:#f8fafc;">Mapa no disponible</p>
          <p style="font-size:12px;">Sin conexión a Internet. El mapa requiere acceso a la red.</p>
          <button onclick="window.location.reload()" style="margin-top:8px;background:#10b981;color:#000;font-weight:800;font-size:12px;padding:8px 20px;border-radius:12px;border:none;cursor:pointer;">🔄 Reintentar</button>
        </div>
      `;
      return;
    }
    this._retryCount = 0;

    // Si ya había una instancia previa de Leaflet, la destruimos de forma segura
    this.destroy();

    // Prevenir error 'Map container is already initialized'
    if (el._leaflet_id) {
      delete el._leaflet_id;
    }

    this.onMarkerClickCallback = onMarkerClick;
    const { lat, lng } = store.userLocation;
    const start = this.lastView
      ? { lat: this.lastView.center.lat, lng: this.lastView.center.lng, zoom: this.lastView.zoom }
      : { lat, lng, zoom: 14 };

    try {
      this.map = window.L.map(containerId, {
        center: [start.lat, start.lng],
        zoom: start.zoom,
        zoomControl: false
      });

      window.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      // CartoDB Dark Matter con fallback automático a OpenStreetMap en caso de error
      const tiles = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      });

      // Leaflet entrega UN solo objeto de evento con { tile, coords }
      tiles.on('tileerror', (e) => {
        const tile = e && e.tile;
        const coords = e && e.coords;
        if (tile && coords && !tile._fallbackDone) {
          tile._fallbackDone = true;
          tile.src = `https://tile.openstreetmap.org/${coords.z}/${coords.x}/${coords.y}.png`;
        }
      });

      tiles.addTo(this.map);

      this.markersLayer = window.L.layerGroup().addTo(this.map);

      // Marcador del usuario: Radar táctico con badge 'TÚ'
      const userIcon = window.L.divIcon({
        className: 'user-radar-icon',
        html: `
          <div class="relative flex flex-col items-center pointer-events-none" style="transform: translate(-50%, -50%);">
            <div class="absolute w-10 h-10 rounded-full bg-emerald-500/20 animate-ping"></div>
            <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_#10b981]">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            </div>
            <span class="mt-1 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-emerald-500/60 text-[9px] font-black text-emerald-400 tracking-wider shadow">
              TÚ
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [0, 0]
      });
      this.userMarker = window.L.marker([lat, lng], { icon: userIcon, interactive: false }).addTo(this.map);

      // La geolocalización se pide UNA vez por sesión (no cada vez que vuelves al mapa)
      if (navigator.geolocation && !store.locationRequested) {
        store.locationRequested = true;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;
            store.userLocation = { lat: uLat, lng: uLng, name: 'Tu ubicación actual', city: '', country: '' };
            if (this.userMarker) this.userMarker.setLatLng([uLat, uLng]);
            if (this.map && !this.lastView) this.map.setView([uLat, uLng], 15);
            reverseGeocode(uLat, uLng).then(info => {
              if (info) store.userLocation = { ...store.userLocation, city: info.city, country: info.country };
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 4000 }
        );
      }

      this.initialized = true;
      this.renderMarkers();

      // Forzar ajuste del tamaño del mapa tras renderizado
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 100);
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 350);
    } catch (err) {
      console.warn('Error inicializando mapa Leaflet:', err);
    }
  }

  renderMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const wcs = store.getFilteredWCs();
    // Identificar el WC con mejor puntuación para destacar su radar
    const maxScore = Math.max(...wcs.map(w => w.score || 0), 0);

    wcs.forEach(wc => {
      const semantic = getSemanticStatus(wc);
      const isTopWC = wc.score >= 90 && wc.score === maxScore;

      let badgeColor = '#10b981'; // esmeralda
      let bgStyle = 'linear-gradient(135deg, #059669, #10b981)';
      let shadowGlow = 'rgba(16, 185, 129, 0.4)';

      if (wc.score < 70 || semantic.color === 'red') {
        badgeColor = '#ef4444';
        bgStyle = 'linear-gradient(135deg, #b91c1c, #ef4444)';
        shadowGlow = 'rgba(239, 68, 68, 0.4)';
      } else if (wc.score < 85 || semantic.color === 'yellow') {
        badgeColor = '#f59e0b';
        bgStyle = 'linear-gradient(135deg, #d97706, #f59e0b)';
        shadowGlow = 'rgba(245, 158, 11, 0.4)';
      }

      if (wc.is_secret) {
        badgeColor = '#a855f7';
        bgStyle = 'linear-gradient(135deg, #7e22ce, #a855f7)';
        shadowGlow = 'rgba(168, 85, 247, 0.4)';
      }

      const labelText = wc.is_secret ? '🔐' : `${esc(wc.score)}`;

      const markerHtml = `
        <div class="relative cursor-pointer group select-none" style="transform: translate(-50%, -50%);">
          ${isTopWC ? `
            <div class="absolute inset-0 -m-2 rounded-full bg-emerald-500/30 animate-radar-wave pointer-events-none"></div>
          ` : ''}
          <div class="flex items-center bg-slate-900/95 hover:bg-slate-800 border-2 rounded-full pl-1 pr-2.5 py-1 shadow-lg transition-transform active:scale-95" style="border-color: ${badgeColor}; box-shadow: 0 4px 14px ${shadowGlow};">
            <div class="w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] text-slate-950 shadow-inner" style="background: ${bgStyle};">
              ${labelText}
            </div>
            <span class="ml-1.5 text-[11px] font-extrabold text-white max-w-[85px] truncate">
              ${esc(wc.name)}
            </span>
          </div>
        </div>
      `;

      const icon = window.L.divIcon({
        className: 'leaflet-tactical-marker',
        html: markerHtml,
        iconSize: [120, 36],
        iconAnchor: [0, 0]
      });

      const marker = window.L.marker([wc.latitude, wc.longitude], { icon });
      marker.on('click', () => {
        if (this.onMarkerClickCallback) {
          this.onMarkerClickCallback(wc);
        } else {
          store.openWcDetail(wc.id);
        }
      });

      this.markersLayer.addLayer(marker);
    });
  }

  panTo(lat, lng, zoom = 16) {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }

  invalidate() {
    if (this.map) {
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200);
    }
  }
}

export const mapManager = new MapManager();
