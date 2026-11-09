#!/usr/bin/env node
/**
 * WC HUNTER — Importador de baños de OpenStreetMap -> SQL para Supabase.
 *
 * Uso:
 *   node scripts/import-osm.mjs <nombre> <sur,oeste,norte,este> --city "Barcelona" --country "España"
 *   Ej.: node scripts/import-osm.mjs barcelona 41.32,2.05,41.47,2.23 --city Barcelona --country España
 *
 * Genera supabase/seed/<nombre>.sql: pegalo en Supabase > SQL Editor > Run.
 * Es idempotente (ON CONFLICT (osm_id) DO NOTHING): puedes volver a ejecutarlo sin duplicar.
 *
 * Opciones:
 *   --input fichero.json   usa una respuesta de Overpass guardada (para pruebas/offline)
 *
 * Datos © colaboradores de OpenStreetMap, licencia ODbL (hay que citarlo: ya se hace en el mapa).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

export function buildQuery([s, w, n, e]) {
  return `[out:json][timeout:60];(node["amenity"="toilets"](${s},${w},${n},${e});way["amenity"="toilets"](${s},${w},${n},${e}););out center tags;`;
}

const sqlStr = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''").replace(/[\u0000-\u001f]/g, ' ')}'`);

/** Convierte elementos de Overpass en filas listas para insertar. */
export function elementsToRows(elements, { city = null, country = null } = {}) {
  const rows = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const t = el.tags || {};

    // Descartar baños no publicos (privados / solo personal)
    if (['private', 'no'].includes(t.access)) continue;

    let access = 'free';
    if (t.fee === 'yes' || t.charge) access = 'paid';
    else if (t.access === 'customers') access = 'customers_only';
    else if (t.access === 'permit' || t.access === 'key') access = 'key_required';

    let price = 0;
    if (access === 'paid' && t.charge) {
      const m = String(t.charge).replace(',', '.').match(/(\d+(?:\.\d+)?)/);
      if (m) price = Math.min(100, Number(m[1]));
    }

    const equipment = {
      wheelchair: t.wheelchair === 'yes' || t['toilets:wheelchair'] === 'yes',
      baby_changing: t.changing_table === 'yes',
      paper: true, soap: true, water: true
    };
    const name = (t.name || t['name:es'] || t.operator || 'WC público').slice(0, 80);
    const address = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ').slice(0, 120) || null;

    rows.push({
      osm_id: `${el.type}/${el.id}`,
      name: name.length < 2 ? 'WC público' : name,
      lat, lng, address,
      type: t.amenity === 'toilets' && t.building ? 'public_building' : 'public_street',
      access, price, equipment,
      opening_hours: t.opening_hours ? String(t.opening_hours).slice(0, 120) : null,
      city, country
    });
  }
  return rows;
}

export function rowsToSql(rows, label) {
  const header = `-- WC HUNTER · semilla OpenStreetMap (${label}) · ${rows.length} baños · generado ${new Date().toISOString()}\n-- © OpenStreetMap contributors (ODbL)\n`;
  const BATCH = 200;
  const out = [header];
  for (let i = 0; i < rows.length; i += BATCH) {
    const values = rows.slice(i, i + BATCH).map(r =>
      `(${sqlStr(r.name)}, ${r.lat}, ${r.lng}, ${sqlStr(r.address)}, ${sqlStr(r.city)}, ${sqlStr(r.country)}, ${sqlStr(r.type)}, ${sqlStr(r.access)}, ${r.price}, false, 'COMMON', ${sqlStr(JSON.stringify(r.equipment))}::jsonb, ${sqlStr(r.opening_hours)}, 'osm', ${sqlStr(r.osm_id)})`
    ).join(',\n');
    out.push(`insert into public.wcs (name, latitude, longitude, address, city, country, type, access_type, price, is_secret, rarity, equipment, opening_hours, source, osm_id)\nvalues\n${values}\non conflict (osm_id) do nothing;\n`);
  }
  return out.join('\n');
}

async function fetchOverpass(query) {
  let lastErr;
  for (let round = 0; round < 2; round++) {
    for (const url of ENDPOINTS) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 90000);
        const res = await fetch(url, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            // Overpass rechaza (406) las peticiones sin User-Agent identificable
            'User-Agent': 'wc-hunter-importer/1.0 (https://github.com/PolMestrichPalau/wc-hunter)'
          },
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
        console.warn(`  ! ${url} fallo (${e.message}), probando otro servidor...`);
      }
    }
    console.warn('  ... esperando 20 s antes de reintentar');
    await new Promise(r => setTimeout(r, 20000));
  }
  throw lastErr;
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const city = flag('city');
  const country = flag('country');
  const input = flag('input');
  const [name, bboxRaw] = args;
  if (!name || (!bboxRaw && !input)) {
    console.error('Uso: node scripts/import-osm.mjs <nombre> <sur,oeste,norte,este> [--city X] [--country Y] [--input fichero.json]');
    process.exit(1);
  }
  let data;
  if (input) {
    data = JSON.parse(readFileSync(input, 'utf8'));
  } else {
    const bbox = bboxRaw.split(',').map(Number);
    if (bbox.length !== 4 || bbox.some(Number.isNaN) || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) {
      console.error('bbox invalido: usa sur,oeste,norte,este (p. ej. 41.32,2.05,41.47,2.23)');
      process.exit(1);
    }
    console.log(`Consultando Overpass para "${name}"...`);
    data = await fetchOverpass(buildQuery(bbox));
  }
  const rows = elementsToRows(data.elements || [], { city, country });
  const file = new URL(`../supabase/seed/${name}.sql`, import.meta.url);
  mkdirSync(dirname(file.pathname.replace(/^\/([A-Za-z]:)/, '$1')), { recursive: true });
  writeFileSync(file, rowsToSql(rows, name));
  console.log(`OK: ${rows.length} baños -> supabase/seed/${name}.sql`);
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('import-osm.mjs')) {
  main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
}
