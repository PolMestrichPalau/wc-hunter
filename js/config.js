/**
 * WC HUNTER — Configuración del backend (Supabase).
 *
 * Si SUPABASE_URL o SUPABASE_ANON_KEY están vacíos, la app funciona en MODO LOCAL
 * (todo en el navegador, sin comunidad).
 *
 * La clave "anon" es PÚBLICA por diseño: la seguridad la dan las reglas RLS y las
 * funciones del servidor (supabase/schema.sql). NUNCA pongas aquí la "service_role".
 */
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
