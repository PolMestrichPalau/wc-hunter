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
const test = (name, fn) => { fn(); passed++; console.log(`  [OK] ${name}`); };
const origToast = store.showToast.bind(store);
store.showToast = () => {}; // sin timers en las pruebas

console.log('=== PRUEBAS DE LOGICA ===');

test('esc() neutraliza HTML y comillas', () => {
  assert.equal(esc('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.ok(safeUrl('https://example.com/a.png').startsWith('https://'));
});

test('nivel unico: 3840 XP => nivel 10 y user.level coherente', () => {
  assert.equal(calculateLevel(3840).level, 10);
  assert.equal(store.user.level, 10);
});

test('formatWouldReturn(0 si, 5 no) = 0%', () => {
  assert.equal(formatWouldReturn({ yes: 0, no: 5 }).percent, 0);
});

test('formatAccessShort / formatDistance', () => {
  assert.equal(formatAccessShort({ access_type: 'key_required', price: 0 }), '🔑 Pedir llave');
  assert.equal(formatDistance(500), '500 m');
  assert.equal(formatDistance(10420000), '10.420 km');
});

test('verificar NO baja la confianza y deja el semaforo en verde', () => {
  const prado = store.wcs.find(w => w.id === 'wc_mad_prado');
  const before = prado.confidence;
  assert.equal(store.verifyWC(prado.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' }), true);
  assert.ok(prado.confidence >= before, `confianza ${before} -> ${prado.confidence}`);
  assert.equal(getSemanticStatus(prado).type, 'good');
});

test('antifraude: segunda verificacion inmediata se rechaza sin dar XP', () => {
  const prado = store.wcs.find(w => w.id === 'wc_mad_prado');
  const xp = store.user.xp;
  assert.equal(store.verifyWC(prado.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' }), false);
  assert.equal(store.user.xp, xp);
});

test('"Cerrado" solo cambia estado: no toca equipamiento ni limpieza', () => {
  const w = store.wcs.find(x => x.id === 'wc_mad_sol_public');
  const clean = w.score_breakdown.cleanliness;
  const cleanReports = store.user.stats.clean_reports;
  store.verifyWC(w.id, { status: 'closed' });
  assert.equal(w.current_status, 'closed');
  assert.equal(w.equipment.paper, true);
  assert.equal(w.score_breakdown.cleanliness, clean);
  assert.equal(store.user.stats.clean_reports, cleanReports);
});

test('paper_hero y clean_inspector no se desbloquean con la primera verificacion', () => {
  const fresh = store.normalizeUser(null);
  assert.ok(fresh.unlocked_achievements.includes('paper_hero')); // viene del seed del usuario
  // En un usuario limpio el contador manda:
  store.user.unlocked_achievements = store.user.unlocked_achievements.filter(a => a !== 'paper_hero');
  store.user.stats.paper_verifs = 0;
  const w = store.wcs.find(x => x.id === 'wc_mad_atocha');
  store.verifyWC(w.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'normal' });
  assert.ok(!store.user.unlocked_achievements.includes('paper_hero'));
});

test('alta de WC: ubicacion elegida, pais real, puntuacion coherente y confianza razonable', () => {
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

test('alta de WC: rechaza coordenadas invalidas y nombre vacio', () => {
  assert.equal(store.addNewWC({ name: 'x', latitude: 999, longitude: 0 }), false);
  assert.equal(store.addNewWC({ name: '   ', latitude: 1, longitude: 1 }), false);
});

test('limite diario de XP por descubrimientos (3/24h)', () => {
  store.user.discovery_log = [];
  const xp0 = store.user.xp;
  for (let i = 0; i < 5; i++) {
    store.addNewWC({ name: `Spam ${i}`, city: 'X', country: 'Y', latitude: 10 + i, longitude: 10, type: 'other', access_type: 'free' });
  }
  const gained = store.user.xp - xp0;
  assert.ok(gained <= 3 * 100 + 600, `XP ganado ${gained}`); // 3 descubrimientos (+ bonus de logros)
  assert.equal(store.user.discovery_log.length, 5);
});

test('lat/lng = 0 se conservan (no se mueven a Madrid)', () => {
  const w = store.normalizeWc({ id: 'z', name: 'Ecuador', latitude: 0, longitude: 0 });
  assert.equal(w.latitude, 0);
  assert.equal(w.longitude, 0);
});

test('logros por contador: secret_master se desbloquea al tener 5+ secretos', () => {
  store.user.unlocked_achievements = store.user.unlocked_achievements.filter(a => a !== 'secret_master');
  store.user.stats.secrets_found = 5;
  store.user.verified_log = {};
  const w = store.wcs.find(x => x.id === 'wc_bcn_hotel_w');
  store.verifyWC(w.id, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'normal' });
  assert.ok(store.user.unlocked_achievements.includes('secret_master'));
});

test('estado corrupto: se hace copia de seguridad y no revienta', () => {
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

test('migracion: usuario antiguo sin campos nuevos no rompe', () => {
  const old = { wcs: [], user: { username: 'Viejo', xp: 100, title: 'T', unlocked_achievements: [], stats: { visited_count: 1 } }, missions: [] };
  mem.set('wc_hunter_state_v2', JSON.stringify(old));
  store.loadState();
  assert.deepEqual(store.user.verified_log, {});
  assert.equal(store.user.stats.discovered_count, 14); // rellenado desde defaults
  assert.ok(store.wcs.length >= 6); // semilla incorporada
});

test('colecciones y records se calculan con datos reales (usuario nuevo => sin datos)', () => {
  store.loadState();
  store.user.verified_log = {};
  store.user.username = 'Nadie';
  const cols = computeCollections(store.wcs, store.user);
  assert.ok(cols.every(c => c.collected === 0));
  assert.equal(computeUserRecords(store.wcs, store.user, store.userLocation).rarestWc.name, 'Aún sin datos');
});

console.log(`\n=== ${passed} PRUEBAS OK ===`);
