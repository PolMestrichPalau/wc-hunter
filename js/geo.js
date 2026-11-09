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
