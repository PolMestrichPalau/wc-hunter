/**
 * WC HUNTER — Módulo de Mapa Interactivo Leaflet V1.0
 */
import { store } from './state.js';
import { getStatusSemantic } from './algorithms.js';

class MapManager {
  constructor() {
    this.map = null;
    this.markersLayer = null;
    this.userMarker = null;
    this.initialized = false;
  }

  init(containerId = 'map-container') {
    if (this.initialized || !window.L) return;

    const el = document.getElementById(containerId);
    if (!el) return;

    // Coordenadas por defecto (Centro de Madrid)
    const { lat, lng } = store.userLocation;

    this.map = window.L.map(containerId, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false
    });

    // Añadir control de zoom en posición inferior derecha
    window.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Tiles limpios y de alto contraste (CartoDB Positron / OSM)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = window.L.layerGroup().addTo(this.map);

    // Marcador del usuario (pulsador azul)
    const userIcon = window.L.divIcon({
      className: 'user-location-marker',
      html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    this.userMarker = window.L.marker([lat, lng], { icon: userIcon }).addTo(this.map);

    // Intentar geolocalización real
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          store.userLocation = { lat: uLat, lng: uLng, name: "Tu Ubicación" };
          this.userMarker.setLatLng([uLat, uLng]);
          this.map.setView([uLat, uLng], 15);
        },
        (err) => console.log('Geolocalización denegada o inaccesible, usando Sol (Madrid):', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
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
      const semantic = getStatusSemantic(wc);
      
      // Color según semántica
      let borderColor = '#10b981'; // verde
      let bgColor = '#ecfdf5';
      let textColor = '#065f46';
      
      if (semantic.color === 'yellow') {
        borderColor = '#f59e0b';
        bgColor = '#fffbeb';
        textColor = '#92400e';
      } else if (semantic.color === 'red') {
        borderColor = '#ef4444';
        bgColor = '#fef2f2';
        textColor = '#991b1b';
      } else if (semantic.color === 'gray') {
        borderColor = '#94a3b8';
        bgColor = '#f8fafc';
        textColor = '#334155';
      }

      // Icono de acceso
      const accessBadge = wc.access_type === 'free' ? '🆓' : (wc.access_type === 'customers_only' ? '🍔' : '💰');
      const secretBadge = wc.is_secret ? '🔐' : '';

      const markerHtml = `
        <div class="custom-wc-marker" style="
          border: 3px solid ${borderColor};
          background: ${bgColor};
          color: ${textColor};
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          border-radius: 14px;
          padding: 4px 7px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          white-space: nowrap;
        ">
          <span style="font-size: 15px;">🚽</span>
          <span>${wc.score}</span>
          <span style="font-size: 11px; opacity: 0.85;">${secretBadge || accessBadge}</span>
        </div>
      `;

      const icon = window.L.divIcon({
        className: 'leaflet-wc-icon',
        html: markerHtml,
        iconSize: [60, 32],
        iconAnchor: [30, 16]
      });

      const marker = window.L.marker([wc.latitude, wc.longitude], { icon });
      marker.on('click', () => {
        store.openWcDetail(wc.id);
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
