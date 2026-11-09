// Pruebas del esquema Supabase contra un Postgres real (PGlite, WebAssembly).
// Ejecutar: npm install && node tests/sql.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();

// --- Prelude: lo que Supabase ya trae (roles + auth.users + auth.uid()) ---
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), is_anonymous boolean default true);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
`);
await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'));

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log(`  [OK] ${name}`); };

const newUser = async () => (await db.query(`insert into auth.users default values returning id`)).rows[0].id;
async function as(uid, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
async function asAnon(fn) {
  await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await fn(); } finally { await db.exec(`reset role;`); }
}
const rpc = async (sql, params = []) => (await db.query(sql, params)).rows[0];
async function expectErr(promise, pattern) {
  try { await promise; } catch (e) { assert.match(e.message, pattern, `error inesperado: ${e.message}`); return; }
  assert.fail(`se esperaba error ${pattern}`);
}
const createWc = (name, lat, lng, over = {}) => rpc(
  `select public.create_wc($1,$2,$3,$4,$5,$6,'free',0,$7) as r`,
  [name, lat, lng, over.ulat ?? lat, over.ulng ?? lng, over.type ?? 'public_street', over.secret ?? false]
).then(x => x.r);
const checkIn = (wc, lat, lng, over = {}) => rpc(
  `select public.check_in($1,$2,$3,$4,$5,$6,$7,$8,$9) as r`,
  [wc, over.rating ?? 4, over.status ?? 'open', over.paper ?? true, over.soap ?? true, over.comment ?? null, over.photo ?? null, lat, lng]
).then(x => x.r);

console.log('=== PRUEBAS SQL (Postgres real) ===');

const A = await newUser();
const B = await newUser();
const C = await newUser();
const D = await newUser();
const BCN = [41.3874, 2.1686]; // Plaza Catalunya

await test('el esquema carga y cada usuario recibe perfil automatico', async () => {
  const { rows } = await db.query(`select username from public.profiles order by created_at`);
  assert.equal(rows.length, 4);
  assert.ok(rows.every(r => /^Caganer_[0-9a-f]{5}$/.test(r.username)));
});

await test('SEGURIDAD: no se puede escribir directamente en tablas desde el cliente', async () => {
  await as(A, async () => {
    await expectErr(db.query(`insert into public.wcs (name, latitude, longitude) values ('hack', 0, 0)`), /permission denied/i);
    await expectErr(db.query(`update public.profiles set xp = 999999 where id = '${A}'`), /permission denied/i);
    await expectErr(db.query(`insert into public.checkins (wc_id, user_id, rating) values (gen_random_uuid(), '${A}', 5)`), /permission denied/i);
    await expectErr(db.query(`select * from public.reports`), /permission denied/i);
    await expectErr(db.query(`select public.apply_xp('${A}', 5000)`), /permission denied/i);
  });
});

await test('SEGURIDAD: un visitante sin sesion puede leer pero no escribir', async () => {
  await asAnon(async () => {
    const r = await rpc(`select count(*)::int as n from public.nearby_wcs(41.38, 2.16, 500, 10)`);
    assert.equal(r.n, 0);
    await expectErr(db.query(`select public.check_in(gen_random_uuid(), 3, 'open', null, null, null, null, 1, 1)`), /permission denied/i);
    await expectErr(db.query(`select public.create_wc('x', 1, 1, 1, 1)`), /permission denied/i);
  });
});

let wc1;
await test('create_wc: crea, valida cercania y da XP (100 + rareza)', async () => {
  await as(A, async () => {
    await expectErr(createWc('Baño lejano', BCN[0], BCN[1], { ulat: 35.7, ulng: 139.8 }), /too_far_to_create/);
    const r = await createWc('WC Plaza Catalunya', ...BCN, { type: 'museum' }); // RARE => +50
    wc1 = r.wc_id;
    assert.equal(r.rarity, 'RARE');
    assert.equal(r.xp_awarded, 150);
    assert.equal(r.profile.xp, 150);
    await expectErr(createWc('  ', ...BCN), /bad_name/);
    await expectErr(createWc('Fuera de mapa', 95, 0), /bad_location/);
  });
});

await test('create_wc: avisa de duplicados (<25 m) y permite forzar', async () => {
  await as(B, async () => {
    await expectErr(createWc('Otro baño igual', BCN[0] + 0.0001, BCN[1]), /duplicate:/);
    const r = (await rpc(`select public.create_wc('Otro baño igual', $1, $2, $1, $2, 'other', 'free', 0, false, null, null, null, '{}', true) as r`,
      [BCN[0] + 0.0001, BCN[1]])).r;
    assert.ok(r.wc_id);
  });
});

await test('create_wc: XP de descubrimiento limitado a 3 altas por 24 h y tope de 10 altas', async () => {
  await as(C, async () => {
    const xps = [];
    for (let i = 0; i < 4; i++) xps.push((await createWc(`Baño C${i}`, 40 + i, 3)).xp_awarded);
    assert.deepEqual(xps, [100, 100, 100, 0]);
    for (let i = 4; i < 10; i++) await createWc(`Baño C${i}`, 40 + i, 3);
    await expectErr(createWc('Baño C10', 60, 3), /daily_limit/);
  });
});

await test('check_in: rechaza lejos (>150 m), pide ubicacion y valida fotos ajenas', async () => {
  await as(D, async () => {
    await expectErr(checkIn(wc1, BCN[0] + 0.01, BCN[1]), /too_far:\d+/);
    await expectErr(db.query(`select public.check_in($1, 4, 'open', null, null, null, null, null, null)`, [wc1]), /location_required/);
    await expectErr(checkIn(wc1, ...BCN, { photo: `${A}/foto.jpg` }), /bad_photo_path/);
    await expectErr(checkIn(wc1, ...BCN, { rating: 9 }), /bad_rating/);
    await expectErr(checkIn('00000000-0000-0000-0000-000000000000', ...BCN), /wc_not_found/);
  });
});

await test('check_in: primer check-in = 15 + 45 (primero) + 10 (primera visita) + 10 (foto)', async () => {
  await as(D, async () => {
    const r = await checkIn(wc1, ...BCN, { rating: 5, photo: `${D}/abc.jpg`, comment: 'Trono de mármol' });
    assert.equal(r.xp_awarded, 80);
    assert.equal(r.first_to_document, true);
    assert.equal(r.breakdown.length, 4);
  });
  const w = await rpc(`select score, checkins_count from public.wcs where id = $1`, [wc1]);
  assert.equal(w.score, 100);
  assert.equal(w.checkins_count, 1);
});

await test('antifraude: cooldown de 3 h por WC y sin XP extra', async () => {
  await as(D, async () => {
    await expectErr(checkIn(wc1, ...BCN), /cooldown:\d+/);
  });
});

await test('check_in: segundo usuario no recibe bonus de "primero" y la nota se promedia', async () => {
  await as(A, async () => {
    const r = await checkIn(wc1, ...BCN, { rating: 3 });
    assert.equal(r.first_to_document, false);
    assert.equal(r.xp_awarded, 25); // 15 + 10 primera visita
  });
  const w = await rpc(`select score, checkins_count from public.wcs where id = $1`, [wc1]);
  assert.equal(w.score, 80); // media(5,3) * 20
  assert.equal(w.checkins_count, 2);
});

await test('check_in "cerrado": no exige nota y no altera la puntuacion', async () => {
  await as(B, async () => {
    const r = await rpc(`select public.check_in($1, null, 'closed', null, null, null, null, $2, $3) as r`, [wc1, ...BCN]).then(x => x.r);
    assert.ok(r.xp_awarded >= 15);
  });
  const w = await rpc(`select score, status from public.wcs where id = $1`, [wc1]);
  assert.equal(w.score, 80);
  assert.equal(w.status, 'closed');
});

await test('lectura: nearby_wcs ordena por cercania y respeta el radio', async () => {
  const rows = (await db.query(`select name from public.nearby_wcs($1, $2, 200, 10)`, BCN)).rows.map(r => r.name);
  assert.deepEqual(rows[0], 'WC Plaza Catalunya');
  assert.equal(rows.length, 2);
  const far = (await db.query(`select * from public.nearby_wcs($1, $2, 100, 10)`, [BCN[0] + 1, BCN[1]])).rows;
  assert.equal(far.length, 0);
  const bounds = (await db.query(`select * from public.wcs_in_bounds(41.3, 2.0, 41.5, 2.3, 50)`)).rows;
  assert.equal(bounds.length, 2);
});

await test('semilla OSM (sin valorar) entra por SQL de administrador y el primero que la documenta gana el bonus', async () => {
  await db.exec(`insert into public.wcs (name, latitude, longitude, type, source, osm_id)
                 values ('WC público (OSM)', 41.4036, 2.1744, 'public_street', 'osm', 'node/1')
                 on conflict (osm_id) do nothing`);
  await db.exec(`insert into public.wcs (name, latitude, longitude, type, source, osm_id)
                 values ('WC público (OSM)', 41.4036, 2.1744, 'public_street', 'osm', 'node/1')
                 on conflict (osm_id) do nothing`);
  const { rows } = await db.query(`select id, score, checkins_count from public.wcs where osm_id = 'node/1'`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].score, null);
  await as(D, async () => {
    const r = await checkIn(rows[0].id, 41.4036, 2.1744, { rating: 4 });
    assert.equal(r.first_to_document, true);
  });
});

await test('importador OSM: el SQL generado carga, escapa comillas/inyecciones y es idempotente', async () => {
  const { elementsToRows, rowsToSql } = await import('../scripts/import-osm.mjs');
  const rows = elementsToRows([
    { type: 'node', id: 9001, lat: 41.5, lon: 2.2, tags: { amenity: 'toilets', name: "Bar l'Èxit'); drop table public.wcs;--", fee: 'yes', charge: '0,50 EUR', wheelchair: 'yes' } },
    { type: 'way', id: 9002, center: { lat: 41.51, lon: 2.21 }, tags: { amenity: 'toilets', access: 'customers', opening_hours: 'Mo-Fr 08:00-20:00' } },
    { type: 'node', id: 9003, lat: 41.52, lon: 2.22, tags: { amenity: 'toilets', access: 'private' } },   // descartado
    { type: 'node', id: 9004, tags: { amenity: 'toilets' } }                                              // sin coordenadas
  ], { city: 'Barcelona', country: 'España' });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].access, 'paid');
  assert.equal(rows[0].price, 0.5);
  assert.equal(rows[1].access, 'customers_only');
  const sql = rowsToSql(rows, 'test');
  await db.exec(sql);
  await db.exec(sql); // segunda vez: no duplica
  const r = (await db.query(`select name, access_type, price, equipment->>'wheelchair' as wc from public.wcs where osm_id = 'node/9001'`)).rows;
  assert.equal(r.length, 1);
  assert.equal(r[0].name, "Bar l'Èxit'); drop table public.wcs;--");
  assert.equal(r[0].wc, 'true');
  assert.equal((await db.query(`select count(*)::int n from public.wcs where osm_id like '%/900%'`)).rows[0].n, 2);
  await db.exec(`delete from public.wcs where osm_id like '%/900%'`);
});

await test('moderacion: 3 reportes distintos ocultan el WC', async () => {
  const id = (await db.query(`select id from public.wcs where name = 'Otro baño igual'`)).rows[0].id;
  for (const u of [A, B]) await as(u, async () => { await rpc(`select public.report_wc($1, 'spam')`, [id]); });
  await as(A, async () => { await rpc(`select public.report_wc($1, 'otra vez')`, [id]); }); // mismo usuario no suma
  assert.equal((await db.query(`select hidden from public.wcs where id = $1`, [id])).rows[0].hidden, false);
  await as(C, async () => { await rpc(`select public.report_wc($1, 'spam')`, [id]); });
  assert.equal((await db.query(`select hidden from public.wcs where id = $1`, [id])).rows[0].hidden, true);
  await as(D, async () => {
    const n = (await db.query(`select * from public.nearby_wcs($1, $2, 5, 10)`, [BCN[0] + 0.0001, BCN[1]])).rows.length;
    assert.equal(n, 0);
  });
});

await test('perfil: renombrar, nombre ocupado y formato invalido', async () => {
  await as(A, async () => {
    const p = (await rpc(`select public.set_profile('ReyDelTrono', '👑', '🧻 Príncipe del Papel') as r`)).r;
    assert.equal(p.username, 'ReyDelTrono');
    assert.equal(p.avatar, '👑');
  });
  await as(B, async () => {
    await expectErr(db.query(`select public.set_profile('reydeltrono')`), /username_taken/);
    await expectErr(db.query(`select public.set_profile('<script>')`), /bad_profile/);
    const me = (await rpc(`select public.my_profile() as r`)).r;
    assert.ok(me.xp >= 0 && me.level >= 1);
  });
});

await test('nivel en servidor = nivel en cliente (3840 XP => 10)', async () => {
  assert.equal((await rpc(`select public.level_for_xp(3840) as l`)).l, 10);
  assert.equal((await rpc(`select public.level_for_xp(0) as l`)).l, 1);
});

await test('racha: crece al dia siguiente y se reinicia tras un hueco', async () => {
  await db.exec(`update public.profiles set last_active_date = (now() at time zone 'utc')::date - 1, streak_days = 4 where id = '${D}'`);
  const wc = (await db.query(`select id from public.wcs where osm_id = 'node/1'`)).rows[0].id;
  await db.exec(`delete from public.checkins where user_id = '${D}'`);
  await as(D, async () => { await checkIn(wc, 41.4036, 2.1744); });
  assert.equal((await db.query(`select streak_days from public.profiles where id = '${D}'`)).rows[0].streak_days, 5);
  await db.exec(`update public.profiles set last_active_date = (now() at time zone 'utc')::date - 9 where id = '${D}'`);
  await db.exec(`delete from public.checkins where user_id = '${D}'`);
  await as(D, async () => { await checkIn(wc, 41.4036, 2.1744); });
  assert.equal((await db.query(`select streak_days from public.profiles where id = '${D}'`)).rows[0].streak_days, 1);
});

console.log(`\n=== ${passed} PRUEBAS SQL OK ===`);
await db.close();
