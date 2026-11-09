/**
 * WC HUNTER — Utilidades compartidas (seguridad de HTML)
 */

/** Escapa texto para insertarlo de forma segura en innerHTML / atributos. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

/**
 * Reduce una foto del usuario (lado máx. 1280 px, JPEG q=0.8) para subirla rápido y barata.
 * Devuelve un Blob. Solo navegador.
 */
export async function resizeImage(file, maxSide = 1280, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h); // re-dibujar elimina los metadatos EXIF (ubicación)
  bitmap.close?.();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('resize_failed'))), 'image/jpeg', quality));
}

/**
 * Versiones para subir (diseñadas para el plan gratuito de almacenamiento y tráfico):
 *  - full: 960 px, calidad 0.7  (~100 KB)
 *  - thumb: 320 px, calidad 0.6 (~15 KB), la que se muestra en listas y fichas
 */
export async function makePhotoVersions(file) {
  const [full, thumb] = await Promise.all([resizeImage(file, 960, 0.7), resizeImage(file, 320, 0.6)]);
  return { full, thumb };
}

/** Devuelve la URL solo si es http(s); si no, cadena vacía (evita javascript:). */
export function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
  } catch (e) {
    return '';
  }
}
