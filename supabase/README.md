# Puesta en marcha de la comunidad (Supabase)

Sin esto la app funciona en **modo local** (datos de demo en tu navegador). Con esto, todos los
usuarios comparten los mismos baños, fotos y puntos.

## 1. Crear el proyecto (5 min)
1. Entra en <https://supabase.com> → **New project** (región **EU**, p. ej. *Frankfurt*). Plan gratuito.
2. **Authentication → Sign In / Providers → Anonymous Sign-Ins → ON**
   (así cada persona entra sin registrarse y su progreso se guarda en su navegador).
3. **SQL Editor → New query**: pega **`supabase/schema.sql`** entero → **Run**.
4. **SQL Editor → New query**: pega **`supabase/storage.sql`** → **Run** (bucket de fotos).

## 2. Conectar la web
**Settings → API**: copia la **Project URL** y la clave **anon public** y pónlas en `js/config.js`:

```js
export const SUPABASE_URL = 'https://xxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';   // clave "anon public"
```
> La clave `anon` es pública por diseño: la seguridad la dan las reglas RLS y las funciones del
> servidor. **Nunca** uses ni publiques la `service_role`.

## 3. Sembrar baños (para que el mapa no esté vacío)
```powershell
node scripts/import-osm.mjs barcelona 41.32,2.05,41.47,2.23 --city Barcelona --country "España"
```
Genera `supabase/seed/barcelona.sql` → pégalo en el SQL Editor y ejecútalo. Se puede repetir sin
duplicar. Formato del recuadro: `sur,oeste,norte,este`. Datos © OpenStreetMap (ODbL).

## 4. Ajustes recomendados antes de abrirlo al público
- **Authentication → Rate Limits**: revisa el límite de altas anónimas por IP.
- **Authentication → Attack Protection**: activa **CAPTCHA** (Cloudflare Turnstile) para frenar bots.
- **Settings → API → Exposed schemas**: deja solo `public`.
- Revisa los reportes: un baño con 3 reportes distintos se oculta solo (`wcs.hidden = true`).
  Para restaurarlo: `update public.wcs set hidden = false where id = '...';`

## Cómo mantenerlo en el plan GRATIS
| Límite gratuito de Supabase | Qué hace la app para no pasarse |
|---|---|
| 50.000 usuarios activos/mes | **Sesión solo al publicar**: quien solo mira el mapa no abre sesión (aparece como "Visitante") |
| 1 GB de fotos | Foto a 960 px (calidad 70) + miniatura de 320 px. Al llegar al ~80 % mueve las fotos a Cloudflare R2 (10 GB gratis, sin coste de tráfico) |
| 5 GB de tráfico/mes | Listas y fichas cargan la miniatura; la foto completa solo al tocar. Caché de 1 año al subir |
| 500 MB de base de datos | ~0,5 KB por check-in (~1 M de check-ins). Siembra solo tu zona |
| Pausa tras 1 semana sin actividad | `.github/workflows/keepalive.yml` consulta la API cada 3 días (se activa solo si `js/config.js` tiene claves) |

Pasa a **Pro ($25/mes)** cuando: fotos > 800 MB, usuarios activos > 40.000 o base de datos > 400 MB
(mira **Settings → Usage** de vez en cuando).

## Qué valida el servidor (el cliente no puede saltárselo)
| Regla | Valor |
|---|---|
| Distancia para hacer check-in | ≤ 150 m del baño |
| Cooldown por baño | 3 h |
| Check-ins por día | 30 |
| Altas de baños por día / con XP | 10 / 3 |
| Distancia para crear un baño | ≤ 500 m |
| Duplicados | aviso si hay otro a < 25 m |
| XP | solo lo calcula la base de datos |

## Pruebas
```powershell
npm install
npm test          # lógica del cliente + esquema SQL contra un Postgres real (PGlite)
```
