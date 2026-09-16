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
    if (this.initialized || !window.L) return;

    const el = document.getElementById(containerId);
    if (!el) return;

    this.onMarkerClickCallback = onMarkerClick;
    const { lat, lng } = store.userLocation;

    this.map = window.L.map(containerId, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false
    });

    window.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // CartoDB Positron / OSM tiles oscuros y limpios
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
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
          this.userMarker.setLatLng([uLat, uLng]);
          this.map.setView([uLat, uLng], 15);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 4000 }
      );
    }

    this.initialized = true;
    this.renderMarkers();
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
