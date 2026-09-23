/**
 * WC HUNTER — Módulo de Mapa Minimalista Leaflet V2.0
 * Marcadores ultra-visuales y limpios: "¿Dónde están?"
 */
import { store } from './state.js';
import { getSemanticStatus } from './engines/wcEngine.js';

class MapManager {
  constructor() {
    this.map = null;
    this.markersLayer = null;
    this.userMarker = null;
    this.initialized = false;
    this.onMarkerClickCallback = null;
  }

  init(containerId = 'map-container', onMarkerClick = null) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!window.L) {
      // BUG-13: mostrar mensaje de error visible si Leaflet no cargó (sin conexión, etc.)
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#080c14;color:#94a3b8;text-align:center;padding:24px;gap:12px;">
          <span style="font-size:48px;">🗺️</span>
          <p style="font-size:13px;font-weight:800;color:#f8fafc;">Mapa no disponible</p>
          <p style="font-size:12px;">Sin conexión a Internet. El mapa requiere acceso a la red.</p>
          <button onclick="window.location.reload()" style="margin-top:8px;background:#f59e0b;color:#000;font-weight:800;font-size:12px;padding:8px 20px;border-radius:12px;border:none;cursor:pointer;">🔄 Reintentar</button>
        </div>
      `;
      return;
    }

    // Si ya había una instancia previa de Leaflet, la destruimos de forma segura
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
      this.markersLayer = null;
      this.userMarker = null;
    }

    this.onMarkerClickCallback = onMarkerClick;
    const { lat, lng } = store.userLocation;

    try {
      this.map = window.L.map(containerId, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false
      });

      window.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      // OpenStreetMap oficial 100% gratuito, sin necesidad de API key
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(this.map);

      this.markersLayer = window.L.layerGroup().addTo(this.map);

      // Marcador del usuario (pulsador azul minimalista)
      const userIcon = window.L.divIcon({
        className: 'user-marker-icon',
        html: `<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      this.userMarker = window.L.marker([lat, lng], { icon: userIcon }).addTo(this.map);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const uLat = pos.coords.latitude;
            const uLng = pos.coords.longitude;
            store.userLocation = { lat: uLat, lng: uLng, name: "Tu Ubicación Actual" };
            if (this.userMarker) this.userMarker.setLatLng([uLat, uLng]);
            if (this.map) this.map.setView([uLat, uLng], 15);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 4000 }
        );
      }

      this.initialized = true;
      this.renderMarkers();
    } catch (err) {
      console.warn('Error inicializando mapa Leaflet:', err);
    }
  }

  renderMarkers() {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const wcs = store.getFilteredWCs();

    wcs.forEach(wc => {
      const semantic = getSemanticStatus(wc);
      
      let dotColor = '#10b981'; // verde
      let bgColor = '#064e3b';
      let textColor = '#a7f3d0';

      if (semantic.color === 'yellow') {
        dotColor = '#f59e0b';
        bgColor = '#451a03';
        textColor = '#fde68a';
      } else if (semantic.color === 'red') {
        dotColor = '#ef4444';
        bgColor = '#450a0a';
        textColor = '#fecaca';
      } else if (semantic.color === 'gray') {
        dotColor = '#94a3b8';
        bgColor = '#1e293b';
        textColor = '#cbd5e1';
      }

      // Si es secreto / legendario, badge especial
      const isLegendary = wc.rarity === 'LEGENDARY' || wc.rarity === 'MYTHIC';
      const labelText = isLegendary ? '🔐' : `${wc.score}`;

      const markerHtml = `
        <div class="minimal-wc-marker" style="
          background: ${bgColor};
          border: 2px solid ${dotColor};
          color: ${textColor};
        ">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor};"></span>
          <span>${labelText}</span>
        </div>
      `;

      const icon = window.L.divIcon({
        className: 'leaflet-minimal-marker',
        html: markerHtml,
        iconSize: [52, 28],
        iconAnchor: [26, 14]
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
      setTimeout(() => this.map.invalidateSize(), 200);
    }
  }
}

export const mapManager = new MapManager();
