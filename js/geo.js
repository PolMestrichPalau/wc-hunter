/**
 * WC HUNTER — Geocodificación inversa (OpenStreetMap Nominatim, sin API key).
 * Best-effort: si falla o no hay red devuelve null.
 */
export async function reverseGeocode(lat, lng) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 4000) : null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&accept-language=es&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const res = await fetch(url, { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const a = json.address || {};
    return {
      city: a.city || a.town || a.village || a.municipality || a.county || '',
      country: a.country || '',
      address: [a.road, a.house_number].filter(Boolean).join(' ') || json.name || ''
    };
  } catch (e) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Escanea en vivo baños reales (amenity=toilets) mediante OpenStreetMap Nominatim (100% libre, 0 API keys).
 */
export async function scanNearbyOsmToilets(lat, lng, radiusMeters = 2000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 7000) : null;
  try {
    const deltaLat = radiusMeters / 111320;
    const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
    const deltaLng = radiusMeters / (111320 * Math.abs(cosLat));

    const minLng = (lng - deltaLng).toFixed(5);
    const maxLng = (lng + deltaLng).toFixed(5);
    const minLat = (lat - deltaLat).toFixed(5);
    const maxLat = (lat + deltaLat).toFixed(5);

    const url = `https://nominatim.openstreetmap.org/search?format=json&amenity=toilets&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=30&addressdetails=1`;
    const res = await fetch(url, {
      signal: ctrl ? ctrl.signal : undefined,
      headers: { Accept: 'application/json', 'User-Agent': 'WCHunterApp/6.0 (OpenStreetMap Scanner)' }
    });
    if (!res.ok) return [];
    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map((item) => {
      const a = item.address || {};
      const street = [a.road, a.house_number].filter(Boolean).join(' ') || item.name || '';
      const city = a.city || a.town || a.municipality || a.county || '';
      const country = a.country || 'España';
      const name = item.name ? item.name : (street ? `WC Público ${street}` : 'WC Público de Calle');

      return {
        id: `osm_${item.osm_type || 'node'}_${item.osm_id || item.place_id}`,
        name: name.slice(0, 80),
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: street || item.display_name?.split(',')[0] || 'Vía pública registrada',
        city: city || 'Zona activa',
        country,
        type: 'public_street',
        rarity: 'COMMON',
        difficulty: 2,
        access_type: 'free',
        access_label: '🆓 Gratuito / Público',
        access_code: '',
        hunter_tip: 'Detectado por Radar Satélite OSM. ¡Sé el primero en verificarlo para ganar +45 XP!',
        price: 0,
        opening_hours: 'Público 24h / Según zona',
        equipment: {
          paper: true,
          soap: true,
          baby_changing: false,
          wheelchair: false
        },
        cleanliness: 'normal',
        score_breakdown: { cleanliness: 75, odor: 75, paper: 80, soap: 75, privacy: 75 },
        score: null,
        unrated: true,
        would_return_ratio: { yes: 0, no: 0 },
        confidence: 60,
        verified_by_count: 0,
        is_secret: false,
        photos: [],
        recent_reviews: []
      };
    }).filter(w => !isNaN(w.latitude) && !isNaN(w.longitude));
  } catch (e) {
    return [];
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Obtiene la ruta a pie calle por calle entre dos puntos mediante el servidor OSRM Walking (100% libre).
 * Devuelve { distanceMeters, durationSeconds, coordinates: [[lat, lng], ...] } o null.
 */
export async function fetchWalkingRoute(startLat, startLng, destLat, destLng) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 6000) : null;
  try {
    const url = `https://router.project-osrm.org/route/v1/walking/${encodeURIComponent(startLng)},${encodeURIComponent(startLat)};${encodeURIComponent(destLng)},${encodeURIComponent(destLat)}?overview=full&geometries=geojson`;
    const res = await fetch(url, {
      signal: ctrl ? ctrl.signal : undefined,
      headers: { Accept: 'application/json', 'User-Agent': 'WCHunterApp/6.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) return null;

    // GeoJSON viene en [lng, lat], Leaflet espera [lat, lng]
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return {
      distanceMeters: Math.round(route.distance || 0),
      durationSeconds: Math.round(route.duration || 0),
      coordinates
    };
  } catch (e) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
