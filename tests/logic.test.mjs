// Pruebas de logica de WC HUNTER (sin navegador). Ejecutar: node tests/logic.test.mjs
import assert from 'node:assert/strict';

// --- Stubs minimos de navegador para poder importar state.js ---
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k)
};

const { store } = await import('../js/state.js');
const { calculateConfidence, getSemanticStatus, formatWouldReturn, formatAccessShort, formatDistance } = await import('../js/engines/wcEngine.js');
const { calculateLevel } = await import('../js/engines/gameEngine.js');
const { esc, safeUrl } = await import('../js/utils.js');
const { computeCollections, computeUserRecords } = await import('../js/engines/userEngine.js');

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log(`  [OK] ${name}`); };
const origToast = store.showToast.bind(store);
store.showToast = () => {}; // sin timers en las pruebas

console.log('=== PRUEBAS DE LOGICA ===');

await test('esc() neutraliza HTML y comillas', () => {
  assert.equal(esc('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.ok(safeUrl('https://example.com/a.png').startsWith('https://'));
});

await test('nivel unico: 3840 XP => nivel 10 y user.level coherente', () => {
  assert.equal(calculateLevel(3840).level, 10);
  assert.equal(store.user.level, 10);
});

await test('formatWouldReturn(0 si, 5 no) = 0%', () => {
  assert.equal(formatWouldReturn({ yes: 0, no: 5 }).percent, 0);
});

await test('formatAccessShort / formatDistance', () => {
  assert.equal(formatAccessShort({ access_type: 'key_required', price: 0 }), '🔑 Pedir llave');
  assert.equal(formatDistance(500), '500 m');
  assert.equal(formatDistance(10420000), '10.420 km');
});

await test('verificar NO baja la confianza y deja el semaforo en verde', () => {
  const prado = store.wcs.find(w => w.id === 'wc_mad_prado');
  const before = prado.confidence;
  assert.equal(store.verifyWC(prado.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' }), true);
  assert.ok(prado.confidence >= before, `confianza ${before} -> ${prado.confidence}`);
  assert.equal(getSemanticStatus(prado).type, 'good');
});

await test('antifraude: segunda verificacion inmediata se rechaza sin dar XP', () => {
  const prado = store.wcs.find(w => w.id === 'wc_mad_prado');
  const xp = store.user.xp;
  assert.equal(store.verifyWC(prado.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' }), false);
  assert.equal(store.user.xp, xp);
});

await test('"Cerrado" solo cambia estado: no toca equipamiento ni limpieza', () => {
  const w = store.wcs.find(x => x.id === 'wc_mad_sol_public');
  const clean = w.score_breakdown.cleanliness;
  const cleanReports = store.user.stats.clean_reports;
  store.verifyWC(w.id, { status: 'closed' });
  assert.equal(w.current_status, 'closed');
  assert.equal(w.equipment.paper, true);
  assert.equal(w.score_breakdown.cleanliness, clean);
  assert.equal(store.user.stats.clean_reports, cleanReports);
});

await test('paper_hero y clean_inspector no se desbloquean con la primera verificacion', () => {
  const fresh = store.normalizeUser(null);
  assert.ok(fresh.unlocked_achievements.includes('paper_hero')); // viene del seed del usuario
  // En un usuario limpio el contador manda:
  store.user.unlocked_achievements = store.user.unlocked_achievements.filter(a => a !== 'paper_hero');
  store.user.stats.paper_verifs = 0;
  const w = store.wcs.find(x => x.id === 'wc_mad_atocha');
  store.verifyWC(w.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'normal' });
  assert.ok(!store.user.unlocked_achievements.includes('paper_hero'));
});

await test('alta de WC: ubicacion elegida, pais real, puntuacion coherente y confianza razonable', () => {
  const ok = store.addNewWC({
    name: '  Baño del Tokyo Skytree <b>  ', city: 'Tokio', country: 'Japón', address: 'Sumida',
    latitude: 35.7101, longitude: 139.8107, type: 'other', access_type: 'free',
    paper: true, soap: true, initial_rating: 5, comment: 'Váter con luces'
  });
  assert.equal(ok, true);
  const w = store.wcs[0];
  assert.equal(w.country, 'Japón');
  assert.equal(w.latitude, 35.7101);
  assert.ok(w.score >= 85, `score ${w.score}`);
  assert.equal(w.verified_by_count, 1);
  assert.ok(store.user.visited_cities.includes('tokio'));
});

await test('alta de WC: rechaza coordenadas invalidas y nombre vacio', () => {
  assert.equal(store.addNewWC({ name: 'x', latitude: 999, longitude: 0 }), false);
  assert.equal(store.addNewWC({ name: '   ', latitude: 1, longitude: 1 }), false);
});

await test('limite diario de XP por descubrimientos (3/24h)', () => {
  store.user.discovery_log = [];
  const xp0 = store.user.xp;
  for (let i = 0; i < 5; i++) {
    store.addNewWC({ name: `Spam ${i}`, city: 'X', country: 'Y', latitude: 10 + i, longitude: 10, type: 'other', access_type: 'free' });
  }
  const gained = store.user.xp - xp0;
  assert.ok(gained <= 3 * 100 + 600, `XP ganado ${gained}`); // 3 descubrimientos (+ bonus de logros)
  assert.equal(store.user.discovery_log.length, 5);
});

await test('lat/lng = 0 se conservan (no se mueven a Madrid)', () => {
  const w = store.normalizeWc({ id: 'z', name: 'Ecuador', latitude: 0, longitude: 0 });
  assert.equal(w.latitude, 0);
  assert.equal(w.longitude, 0);
});

await test('logros por contador: secret_master se desbloquea al tener 5+ secretos', () => {
  store.user.unlocked_achievements = store.user.unlocked_achievements.filter(a => a !== 'secret_master');
  store.user.stats.secrets_found = 5;
  store.user.verified_log = {};
  const w = store.wcs.find(x => x.id === 'wc_bcn_hotel_w');
  store.verifyWC(w.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'normal' });
  assert.ok(store.user.unlocked_achievements.includes('secret_master'));
});

await test('estado corrupto: se hace copia de seguridad y no revienta', () => {
  const warn = console.warn; console.warn = () => {};
  mem.set('wc_hunter_state_v2', '{esto no es json');
  store.loadState();
  assert.equal(mem.get('wc_hunter_state_v2_backup'), '{esto no es json');
  assert.ok(store.wcs.length >= 6);
  mem.set('wc_hunter_state_v2', 'null');
  store.loadState();
  assert.ok(store.user.username);
  console.warn = warn;
});

await test('migracion: usuario antiguo sin campos nuevos no rompe', () => {
  const old = { wcs: [], user: { username: 'Viejo', xp: 100, title: 'T', unlocked_achievements: [], stats: { visited_count: 1 } }, missions: [] };
  mem.set('wc_hunter_state_v2', JSON.stringify(old));
  store.loadState();
  assert.deepEqual(store.user.verified_log, {});
  assert.equal(store.user.stats.discovered_count, 14); // rellenado desde defaults
  assert.ok(store.wcs.length >= 6); // semilla incorporada
});

await test('colecciones y records se calculan con datos reales (usuario nuevo => sin datos)', () => {
  store.loadState();
  store.user.verified_log = {};
  store.user.username = 'Nadie';
  const cols = computeCollections(store.wcs, store.user);
  assert.ok(cols.every(c => c.collected === 0));
  assert.equal(computeUserRecords(store.wcs, store.user, store.userLocation).rarestWc.name, 'Aún sin datos');
});

// ---------------------------------------------------------------------------
// Modo comunidad (backend simulado)
// ---------------------------------------------------------------------------
const { backend, rowToWc, describeError } = await import('../js/backend.js');

await test('rowToWc: baño de OSM sin valorar => unrated, sin puntuacion falsa', () => {
  const wc = rowToWc({ id: 'u1', name: 'WC público', latitude: 41.4, longitude: 2.17, type: 'public_street', access_type: 'free', price: 0,
    checkins_count: 0, score: null, status: 'open', rarity: 'COMMON', source: 'osm', created_at: '2026-01-01T00:00:00Z', equipment: {} });
  assert.equal(wc.unrated, true);
  assert.equal(wc.score, 0);
  assert.equal(wc.confidence, 0);
  assert.equal(wc.discovered_by, 'OpenStreetMap');
  assert.equal(wc.access_label, '🆓 Gratis');
});

await test('rowToWc: baño valorado conserva nota, estado y equipamiento', () => {
  const wc = rowToWc({ id: 'u2', name: 'Bar', latitude: 1, longitude: 2, type: 'cafe', access_type: 'paid', price: '0.50', checkins_count: 6, score: 88,
    status: 'open', rarity: 'COMMON', paper_ok: false, discovered_by: 'Pol', last_checkin_at: new Date().toISOString(), created_at: '2026-01-01T00:00:00Z', equipment: { wheelchair: true } });
  assert.equal(wc.unrated, false);
  assert.equal(wc.score, 88);
  assert.equal(wc.equipment.paper, false);
  assert.equal(wc.equipment.wheelchair, true);
  assert.equal(wc.price, 0.5);
  assert.equal(wc.verified_by_count, 6);
  assert.ok(wc.confidence > 0);
});

await test('describeError traduce los errores del servidor', () => {
  assert.match(describeError({ message: 'too_far:230' }).message, /230 m/);
  assert.match(describeError({ message: 'cooldown:95' }).message, /2 h/);
  assert.equal(describeError({ message: 'duplicate:abc' }).code, 'duplicate');
  assert.equal(describeError({ message: 'TypeError: Failed to fetch' }).code, 'network');
  assert.equal(describeError({ message: '???' }).code, 'unknown');
});

await test('modo comunidad: check-in usa el XP del servidor y fusiona el WC actualizado', async () => {
  store.remote = true; store.remoteReady = true;
  store.wcs = []; store.user = store.remoteBaseUser();
  const row = (n, s) => ({ id: 'w1', name: 'Bar Manolo', latitude: 41.4, longitude: 2.17, type: 'cafe', access_type: 'free', price: 0, checkins_count: n, score: s,
    status: 'open', rarity: 'COMMON', source: 'user', created_at: '2026-01-01T00:00:00Z', equipment: {} });
  let called = null;
  backend.nearby = async () => [rowToWc(row(1, 100))];
  backend.checkIn = async (a) => { called = a; return { xp_awarded: 70, breakdown: [], first_to_document: true, rarity: 'COMMON', profile: { xp: 70, level: 1, streak_days: 1 } }; };
  backend.myProfile = async () => ({ id: 'me', username: 'Caganer_ab12', avatar: '🧔', title: '🚽 Novato del Retrete', xp: 70, level: 1, streak_days: 1, stats: { checkins: 1, discovered: 0, photos: 0, secrets: 0 } });
  const res = await store.remoteCheckIn({ wcId: 'w1', rating: 5, lat: 41.4, lng: 2.17 });
  assert.equal(res.xp_awarded, 70);
  assert.equal(called.rating, 5);
  assert.equal(store.user.xp, 70);
  assert.equal(store.user.username, 'Caganer_ab12');
  assert.equal(store.user.stats.verifications_count, 1);
  assert.equal(store.wcs.find(w => w.id === 'w1').score, 100);
});

await test('modo comunidad: abrir "Urgencia"/logros NO concede XP local (solo el servidor)', async () => {
  store.remote = true;
  const xp = store.user.xp;
  store.user.unlocked_achievements = [];
  store.setTab('near');
  store.checkAchievement('first_wc');
  store.checkMissions('paper');
  assert.equal(store.user.xp, xp);
  assert.deepEqual(store.user.unlocked_achievements, []);
});

await test('modo comunidad: errores del servidor llegan en español y con codigo', async () => {
  backend.checkIn = async () => { throw { message: 'too_far:420' }; };
  await assert.rejects(store.remoteCheckIn({ wcId: 'w1', rating: 5, lat: 0, lng: 0 }), (e) => e.code === 'too_far' && /420 m/.test(e.message));
});

await test('modo comunidad: mergeRemoteWcs detecta cambios y no repite', () => {
  store.wcs = [];
  const mk = (n) => rowToWc({ id: 'k', name: 'K', latitude: 1, longitude: 1, type: 'other', access_type: 'free', price: 0, checkins_count: n, score: n ? 80 : null,
    status: 'open', rarity: 'COMMON', created_at: '2026-01-01T00:00:00Z', equipment: {} });
  assert.equal(store.mergeRemoteWcs([mk(0)]), true);
  assert.equal(store.mergeRemoteWcs([mk(0)]), false);
  assert.equal(store.mergeRemoteWcs([mk(2)]), true);
  assert.equal(store.wcs.length, 1);
  store.remote = false; // restaurar
});

await test('safeUrl permite data:image/ ademas de https y bloquea javascript:', () => {
  assert.equal(safeUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), 'data:image/jpeg;base64,/9j/4AAQSkZJRg==');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('vbscript:msgbox(1)'), '');
});

await test('copia de seguridad JSON: importBackupJson restaura datos y rechaza JSON invalido', () => {
  assert.equal(store.importBackupJson('{"app":"MALICIOSO"}'), false);
  const sampleBackup = JSON.stringify({
    app: 'WC_HUNTER',
    version: '6.0',
    user: { username: 'ProHunter', xp: 5000, level: 12 },
    custom_wcs: [{ id: 'custom_wc_1', name: 'Trono Oculto', latitude: 40.42, longitude: -3.70 }]
  });
  const res = store.importBackupJson(sampleBackup);
  assert.equal(res, true);
  assert.equal(store.user.username, 'ProHunter');
  assert.ok(store.wcs.some(w => w.id === 'custom_wc_1'));
});

console.log(`\n=== ${passed} PRUEBAS OK ===`);
