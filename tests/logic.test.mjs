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
const { calculateConfidence, getSemanticStatus, formatWouldReturn, formatAccessShort, formatDistance, calculateWCScore, calculateDistanceMeters } = await import('../js/engines/wcEngine.js');
const { calculateLevel, getLevelXP } = await import('../js/engines/gameEngine.js');
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
  assert.ok(w.score >= 75, `score ${w.score}`);
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
  assert.equal(store.user.discovery_log.length, 3); // Solo los descubrimientos premiados consumen cuota de la ventana
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

await test('robustez matematica: calculateWCScore tolera fechas corruptas sin producir NaN', () => {
  const score = calculateWCScore({ cleanliness: 80 }, [
    { created_at: 'FECHA_CORRUPTA', overall_rating: 4 },
    { created_at: null, overall_rating: 5 }
  ]);
  assert.ok(Number.isFinite(score));
  assert.ok(score >= 0 && score <= 100);
});

await test('robustez matematica: calculateConfidence detecta contradiccion en estado y jabon', () => {
  const now = Date.now();
  const dummyWc = { verified_by_count: 5, last_verified_at: new Date(now).toISOString() };
  const confStatusConflict = calculateConfidence(dummyWc, [
    { user_id: 'u1', status: 'open', timestamp: now },
    { user_id: 'u2', status: 'closed', timestamp: now }
  ], now);
  assert.equal(confStatusConflict.hasContradiction, true);

  const confSoapConflict = calculateConfidence(dummyWc, [
    { user_id: 'u1', has_soap: true, timestamp: now },
    { user_id: 'u2', has_soap: false, timestamp: now }
  ], now);
  assert.equal(confSoapConflict.hasContradiction, true);
});

await test('robustez matematica: calculateDistanceMeters devuelve NaN ante entradas invalidas y valida longitud', () => {
  assert.ok(Number.isNaN(calculateDistanceMeters(undefined, null, NaN, 'invalido')));
  assert.ok(Number.isNaN(calculateDistanceMeters(null, null, 0, 1)));
  assert.ok(Number.isNaN(calculateDistanceMeters('', 0, 0, 0)));
  assert.ok(Number.isNaN(calculateDistanceMeters(0, 500, 0, 0)));
  assert.ok(Number.isNaN(calculateDistanceMeters(0, 0, 0, -200)));
  assert.ok(Number.isNaN(calculateDistanceMeters(true, false, 0, 0)));
  assert.ok(calculateDistanceMeters(40.4168, -3.7038, 40.4170, -3.7040) > 0);
});

await test('robustez estructural: calculateConfidence y getSemanticStatus toleran null sin excepciones', () => {
  assert.ok(calculateConfidence(null).confidence >= 5);
  assert.ok(calculateConfidence(null, null).confidence >= 5);
  assert.ok(calculateConfidence({}).confidence >= 5);
  assert.equal(getSemanticStatus(null).type, 'unknown');
  assert.equal(getSemanticStatus(undefined).type, 'unknown');
});

await test('robustez matematica: Haversine antipodal 0% NaNs (blindaje safeA)', () => {
  let naNs = 0;
  for (let i = 0; i < 5000; i++) {
    const lat = (Math.random() - 0.5) * 179;
    const lon = (Math.random() - 0.5) * 359;
    const oppLat = -lat;
    const oppLon = lon > 0 ? lon - 180 : lon + 180;
    const dist = calculateDistanceMeters(lat, lon, oppLat, oppLon);
    if (Number.isNaN(dist) || !Number.isFinite(dist)) naNs++;
  }
  assert.equal(naNs, 0, 'Haversine no debe producir NaNs en antípodas terrestres');
});

await test('robustez matematica: invariante de frontera de nivel L=1..200 exacto y saturacion en Infinity', () => {
  let boundaryFails = 0;
  for (let L = 1; L <= 200; L++) {
    const baseXP = getLevelXP(L);
    const computedLevel = calculateLevel(baseXP).level;
    if (computedLevel !== L) boundaryFails++;
  }
  assert.equal(boundaryFails, 0, 'La inversa calculateLevel debe coincidir exactamente en todas las fronteras L=1..200');
  assert.equal(calculateLevel(Infinity).rank, '👑 Leyenda del Retrete');
  assert.ok(calculateLevel(Infinity).level >= 100);
});

await test('robustez codigo: inmunidad completa a NaN en calculos y mutaciones', () => {
  const scoreFromStr = calculateWCScore({ cleanliness: 'abc', paper: null, soap: undefined });
  assert.ok(Number.isFinite(scoreFromStr) && scoreFromStr >= 0 && scoreFromStr <= 100);

  const levelFromNaN = calculateLevel(NaN);
  assert.equal(levelFromNaN.level, 1);
  assert.equal(levelFromNaN.xp, 0);

  const xpBefore = store.user.xp;
  store.addXP(undefined);
  store.addXP(NaN);
  store.addXP(-50);
  assert.equal(store.user.xp, xpBefore);
  assert.ok(Number.isFinite(store.user.xp));
});

await test('rigor matematico: estimador Bayesiano no circular responde a reseñas reales y decae a prior', () => {
  const now = Date.now();
  // 1 sola reseña de hace 365 días con 100 -> el decaimiento temporal reduce su peso y contrae al prior poblacional 70
  const decayedScore = calculateWCScore({ cleanliness: 70 }, [
    { created_at: new Date(now - 365 * 86400000).toISOString(), overall_rating: 5, user_reputation: 90 }
  ], now);
  assert.equal(decayedScore, 70, `El Score debe contraerse al prior neutral global 70: ${decayedScore}`);

  // Reseñas negativas reales con rating 1 tiran abajo un baño con prior inicial alto (sin circularidad)
  const badReviews = [];
  for (let i = 0; i < 10; i++) {
    badReviews.push({ created_at: new Date(now).toISOString(), overall_rating: 1, user_reputation: 90 });
  }
  const scoreWithBadReviews = calculateWCScore({ cleanliness: 90 }, badReviews, now);
  assert.ok(scoreWithBadReviews <= 35, `10 reseñas reales pésimas deben bajar la nota a ~30: ${scoreWithBadReviews}`);
});

await test('rigor matematico: contradicciones multivariables verifican magnitud (-45 y -35), ventana 72h y >=2 usuarios', () => {
  const now = Date.now();
  const baseWc = { verified_by_count: 5, last_verified_at: new Date(now).toISOString() };

  // Conflicto de estado entre 2 usuarios en las últimas 2 horas -> penalización -45
  const c1 = calculateConfidence(baseWc, [
    { user_id: 'u1', status: 'open', timestamp: now },
    { user_id: 'u2', status: 'closed', timestamp: now }
  ], now);
  const cNoConflict = calculateConfidence(baseWc, [
    { user_id: 'u1', status: 'open', timestamp: now },
    { user_id: 'u2', status: 'open', timestamp: now }
  ], now);
  assert.equal(c1.hasContradiction, true);
  assert.equal(cNoConflict.confidence - c1.confidence, 45, 'Penalización por conflicto de estado debe ser exactamente 45');

  // Conflicto de papel entre 2 usuarios -> penalización -35
  const cPaper = calculateConfidence(baseWc, [
    { user_id: 'u1', has_paper: true, timestamp: now },
    { user_id: 'u2', has_paper: false, timestamp: now }
  ], now);
  assert.equal(cPaper.hasContradiction, true);
  assert.equal(cNoConflict.confidence - cPaper.confidence, 35, 'Penalización por conflicto de suministros debe ser exactamente 35');

  // Mismo usuario contradiciéndose a sí mismo -> NO activa contradicción (antifraude)
  const cSingleUser = calculateConfidence(baseWc, [
    { user_id: 'u1', status: 'open', timestamp: now - 3600000 },
    { user_id: 'u1', status: 'closed', timestamp: now }
  ], now);
  assert.equal(cSingleUser.hasContradiction, false, 'Un solo usuario no debe poder penalizar por contradicción');

  // Conflicto antiguo de hace más de 72 horas -> NO penaliza
  const cOldConflict = calculateConfidence(baseWc, [
    { user_id: 'u1', status: 'open', timestamp: now - 80 * 3600 * 1000 },
    { user_id: 'u2', status: 'closed', timestamp: now - 80 * 3600 * 1000 }
  ], now);
  assert.equal(cOldConflict.hasContradiction, false, 'Contradicciones fuera de la ventana de 72h no deben penalizar');
});

await test('antifraude: rechazo de duplicados a menos de 35 metros (pero permite validar OSM)', () => {
  const original = store.wcs[0];
  const duplicateResult = store.addNewWC({
    name: 'WC Clon',
    latitude: original.latitude,
    longitude: original.longitude,
    access_type: 'free'
  });
  assert.equal(duplicateResult, false, 'No se debe permitir crear duplicados a menos de 35 metros');
});

await test('antifraude: feedbackModal / rewardFeedback tiene cuota diaria (max 1 por 24h)', () => {
  store.user.feedback_log = [];
  const xp0 = store.user.xp;
  const first = store.rewardFeedback();
  assert.equal(first, true);
  assert.equal(store.user.xp, xp0 + 20);

  // Segundo intento inmediato -> rechazado sin dar XP
  const second = store.rewardFeedback();
  assert.equal(second, false);
  assert.equal(store.user.xp, xp0 + 20);
});

await test('antifraude: limite diario de XP por verificaciones (max 10/24h)', () => {
  store.user.verification_log = [];
  store.user.verified_log = {};
  let rewardedCount = 0;
  for (let i = 0; i < 15; i++) {
    const dummyId = `wc_test_verif_${i}`;
    store.wcs.push({
      id: dummyId, name: `WC Test ${i}`, latitude: 40 + i * 0.01, longitude: -3,
      verified_by_count: 1, score_breakdown: { cleanliness: 75 }, score: 75,
      equipment: { paper: true, soap: true }, recent_reports: []
    });
    const xpBefore = store.user.xp;
    store.verifyWC(dummyId, { status: 'open', has_paper: true, has_soap: true });
    if (store.user.xp > xpBefore) rewardedCount++;
  }
  assert.equal(rewardedCount, 10, 'Solo las primeras 10 verificaciones deben otorgar XP');
});

await test('antifraude: touchStreak usa fecha local y es resistente a saltos de reloj', () => {
  store.user.last_active_date = '2026-05-10';
  store.user.streak_days = 5;

  // Intento de salto hacia atrás en el tiempo (reloj manipulado)
  store.touchStreak(Date.parse('2026-05-08T12:00:00'));
  assert.equal(store.user.streak_days, 5, 'Racha no debe corromperse con saltos hacia el pasado');

  // Día siguiente consecutivo normal
  store.touchStreak(Date.parse('2026-05-11T12:00:00'));
  assert.equal(store.user.streak_days, 6, 'Racha se incrementa en +1 al avanzar 1 día');

  // Salto hacia adelante de más de 1 día (hueco)
  store.touchStreak(Date.parse('2026-05-15T12:00:00'));
  assert.equal(store.user.streak_days, 1, 'Racha debe reiniciarse a 1 tras un salto o hueco temporal');
});

await test('ciclo de vida OSM: verificar bano unrated limpia el flag a unrated=false', () => {
  const osmId = 'wc_osm_test_unrated';
  store.wcs.push(store.normalizeWc({
    id: osmId, name: 'WC Callejero OSM', latitude: 42.0, longitude: 2.0,
    unrated: true, score: 0, verified_by_count: 0, recent_reports: []
  }));
  const target = store.wcs.find(w => w.id === osmId);
  assert.equal(target.unrated, true);

  store.verifyWC(osmId, { status: 'open', has_paper: true, has_soap: true, cleanliness: 'clean' });
  assert.equal(target.unrated, false, 'Tras ser verificado por un cazador, unrated debe ser false');
  assert.ok(target.score > 0, `El score debe ser > 0 tras verificacion: ${target.score}`);
});

await test('semantica cerrada: reporte cerrado NO inyecta resena de calidad con limpieza 20', () => {
  const wcId = 'wc_test_closed_isolation';
  store.wcs.push(store.normalizeWc({
    id: wcId, name: 'WC Puerta Bloqueada', latitude: 43.0, longitude: 2.0,
    score_breakdown: { cleanliness: 90, paper: 90, soap: 90 }, reviews: []
  }));
  const target = store.wcs.find(w => w.id === wcId);
  const reviewsCountBefore = (target.reviews || []).length;

  store.verifyWC(wcId, { status: 'closed' });
  assert.equal(target.current_status, 'closed');
  // No debe haberse anadido una resena de limpieza baja a reviews:
  assert.equal((target.reviews || []).length, reviewsCountBefore, 'Reporte cerrado no debe inventar una resena de limpieza');
});

await test('modo comunidad: rewardFeedback devuelve false y no concede XP local no autorizado', () => {
  store.remote = true;
  const xpBefore = store.user.xp;
  const res = store.rewardFeedback();
  assert.equal(res, false);
  assert.equal(store.user.xp, xpBefore, 'En modo remoto no se debe otorgar XP local de feedback');
  store.remote = false; // Restaurar
});

await test('scanOsmRadar: deduplica con Haversine a <35m y normaliza a unrated=true con score=0', async () => {
  store.wcs.push(store.normalizeWc({ id: 'wc_existing_sol', latitude: 40.4168, longitude: -3.7038, name: 'Sol Existente' }));
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { osm_type: 'node', osm_id: '991', lat: '40.4168', lon: '-3.7038', name: 'WC Sol Duplicado' },
      { osm_type: 'node', osm_id: '992', lat: '40.4900', lon: '-3.7500', name: 'WC Nuevo Alejado' }
    ]
  });

  const count = await store.scanOsmRadar(40.4168, -3.7038);
  globalThis.fetch = origFetch;

  assert.equal(count, 1, 'Solo debe anadir el bano no duplicado');
  const added = store.wcs.find(w => w.id === 'osm_node_992');
  assert.ok(added);
  assert.equal(added.unrated, true);
  assert.equal(added.score, 0);
});

console.log(`\n=== ${passed} PRUEBAS OK ===`);
