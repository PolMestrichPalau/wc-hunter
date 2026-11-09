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

/** Devuelve la URL solo si es http(s); si no, cadena vacía (evita javascript:). */
export function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
  } catch (e) {
    return '';
  }
}
