/**
 * WC HUNTER — State Manager & Store Reactivo Local-First
 */
import { INITIAL_USER, INITIAL_WCS, ACHIEVEMENTS_CATALOG, MISSIONS_LIST } from './seedData.js';
import { calculateRarityAndDifficulty, calculateXPForAction } from './algorithms.js';
import { calculateLevel } from './engines/gameEngine.js';
import { calculateWCScore, calculateConfidence } from './engines/wcEngine.js';
import { UNLOCKED_TITLES_POOL, getAchievementProgress } from './engines/userEngine.js';

const STORAGE_KEY = 'wc_hunter_state_v2';
const BACKUP_KEY = 'wc_hunter_state_v2_backup';

// Antifraude
const VERIFY_COOLDOWN_MS = 3 * 60 * 60 * 1000;   // 1 verificacion por WC cada 3 h
const DISCOVERY_XP_PER_DAY = 3;                   // descubrimientos que dan XP cada 24 h
const MAX_REPORTS_KEPT = 5;

const clone = (o) => JSON.parse(JSON.stringify(o));
const isNum = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const num = (v, fallback) => (isNum(v) ? Number(v) : fallback);

function safeStorage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
}

class Store {
  constructor() {
    this.subscribers = [];
    this.loadState();
  }

  // ---- PERSISTENCIA ----

  loadState() {
    let parsed = null;
    const ls = safeStorage();
    try {
      if (ls) {
        ls.removeItem('wc_hunter_state_v1');
        const saved = ls.getItem(STORAGE_KEY);
        if (saved) {
          try {
            parsed = JSON.parse(saved);
          } catch (e) {
            parsed = null;
          }
          if (!parsed || typeof parsed !== 'object') {
            // Estado corrupto: guardar copia de seguridad antes de restablecer
            try { ls.setItem(BACKUP_KEY, saved); } catch (e) {}
            console.warn('Estado corrupto en localStorage. Copia en', BACKUP_KEY);
            parsed = null;
          }
        }
      }
    } catch (e) {
      console.warn('Error leyendo localStorage:', e);
      parsed = null;
    }

    if (parsed) {
      try {
        this.hydrate(parsed);
      } catch (e) {
        console.warn('Error hidratando estado, restableciendo defaults:', e);
        try { ls && ls.setItem(BACKUP_KEY, JSON.stringify(parsed)); } catch (e2) {}
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }

    // Estado efímero de sesión
    this.currentTab = 'map';
    this.intentFilter = null;
    this.searchQuery = '';
    this.selectedWc = null;
    this.isAddModalOpen = false;
    this.activeToasts = [];
    this.locationRequested = false;
    this.userLocation = { lat: 40.4168, lng: -3.7038, name: 'Madrid (Sol)', city: 'Madrid', country: 'España' }; // fallback inicial
  }

  hydrate(parsed) {
    const savedWcs = Array.isArray(parsed.wcs) ? parsed.wcs.map(w => this.normalizeWc(w)).filter(Boolean) : [];
    this.wcs = savedWcs.length > 0 ? savedWcs : clone(INITIAL_WCS).map(w => this.normalizeWc(w));

    // Incorporar WC semilla nuevos (que aun no estaban en el estado guardado)
    const have = new Set(this.wcs.map(w => w.id));
    const seen = new Set(Array.isArray(parsed.seen_seed_ids) ? parsed.seen_seed_ids : []);
    INITIAL_WCS.forEach(seed => {
      if (!have.has(seed.id) && !seen.has(seed.id)) this.wcs.push(this.normalizeWc(clone(seed)));
    });

    this.user = this.normalizeUser(parsed.user);

    const savedMissions = Array.isArray(parsed.missions) ? parsed.missions : [];
    this.missions = clone(MISSIONS_LIST).map(seed => {
      const prev = savedMissions.find(m => m && m.id === seed.id);
      return prev ? { ...seed, progress: num(prev.progress, 0), completed: Boolean(prev.completed) } : seed;
    });
  }

  resetToDefaults() {
    this.wcs = clone(INITIAL_WCS).map(w => this.normalizeWc(w));
    this.user = this.normalizeUser(null);
    this.missions = clone(MISSIONS_LIST);
    this.saveState();
  }

  normalizeUser(u) {
    const base = clone(INITIAL_USER);
    if (!u || typeof u !== 'object' || !u.username) {
      base.level = calculateLevel(base.xp).level;
      return base;
    }
    const merged = { ...base, ...u, stats: { ...base.stats, ...(u.stats || {}) } };
    merged.unlocked_achievements = Array.isArray(u.unlocked_achievements) ? u.unlocked_achievements : base.unlocked_achievements;
    merged.unlocked_titles = Array.isArray(u.unlocked_titles) && u.unlocked_titles.length ? u.unlocked_titles : base.unlocked_titles;
    merged.verified_log = u.verified_log && typeof u.verified_log === 'object' && !Array.isArray(u.verified_log) ? u.verified_log : {};
    merged.discovery_log = Array.isArray(u.discovery_log) ? u.discovery_log : [];
    merged.visited_cities = Array.isArray(u.visited_cities) ? u.visited_cities : [];
    merged.visited_countries = Array.isArray(u.visited_countries) ? u.visited_countries : [];
    merged.xp = num(merged.xp, 0);
    merged.streak_days = num(merged.streak_days, 0);
    merged.level = calculateLevel(merged.xp).level;
    if (!merged.unlocked_titles.includes(merged.title)) merged.unlocked_titles.push(merged.title);
    return merged;
  }

  normalizeWc(wc) {
    if (!wc) return null;
    const eq = wc.equipment || {};
    const sb = wc.score_breakdown || {};
    const reviews = num(wc.reviews_count, 5);
    return {
      id: wc.id || `wc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: wc.name || 'WC sin nombre',
      latitude: num(wc.latitude, 40.4168),
      longitude: num(wc.longitude, -3.7038),
      address: wc.address || 'Ubicación registrada',
      city: wc.city || 'Madrid',
      country: wc.country || 'España',
      type: wc.type || 'other',
      rarity: wc.rarity || 'COMMON',
      difficulty: num(wc.difficulty, 3),
      access_type: wc.access_type || 'free',
      access_label: wc.access_label || '🆓 Gratuito',
      price: num(wc.price, 0),
      opening_hours: wc.opening_hours || 'Horario no especificado',
      equipment: {
        paper: eq.paper ?? true,
        soap: eq.soap ?? true,
        water: eq.water ?? true,
        mirror: eq.mirror ?? true,
        dryer: eq.dryer ?? false,
        baby_changing: eq.baby_changing ?? false,
        wheelchair: eq.wheelchair ?? false,
        bidet: eq.bidet ?? false,
        lock_functional: eq.lock_functional ?? true
      },
      score: num(wc.score, 80),
      score_breakdown: {
        cleanliness: num(sb.cleanliness, 80),
        odor: num(sb.odor, 80),
        paper: num(sb.paper, 80),
        soap: num(sb.soap, 80),
        privacy: num(sb.privacy, 80),
        condition: num(sb.condition, 80),
        price: num(sb.price, 80)
      },
      confidence: num(wc.confidence, 85),
      current_status: wc.current_status || 'open',
      personality_tag: wc.personality_tag || '🚽 EL TRONO',
      personality_desc: wc.personality_desc || '',
      last_verified_at: wc.last_verified_at || new Date().toISOString(),
      would_return_ratio: wc.would_return_ratio || { yes: 10, no: 1 },
      is_secret: Boolean(wc.is_secret),
      photos: Array.isArray(wc.photos) ? wc.photos : [],
      discovered_by: wc.discovered_by || 'PolM',
      discovered_date: wc.discovered_date || '',
      creator_name: wc.creator_name || '',
      reviews_count: reviews,
      verified_by_count: num(wc.verified_by_count, Math.max(1, reviews)),
      recent_reports: Array.isArray(wc.recent_reports) ? wc.recent_reports.slice(-MAX_REPORTS_KEPT) : []
    };
  }

  saveState() {
    const ls = safeStorage();
    if (!ls) return;
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify({
        wcs: this.wcs,
        user: this.user,
        missions: this.missions,
        seen_seed_ids: INITIAL_WCS.map(w => w.id)
      }));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  // ---- SUSCRIPCIONES ----

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    // Solo se persiste en eventos que modifican datos reales (no navegacion, busqueda ni toasts)
    const PERSIST_EVENTS = new Set([
      'WC_VERIFIED', 'WC_CREATED', 'XP_EARNED', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'USER_UPDATED'
    ]);
    if (PERSIST_EVENTS.has(event)) {
      this.saveState();
    }
    // Aislar errores de cada suscriptor para no bloquear a los demas
    this.subscribers.forEach(cb => {
      try { cb(event, payload); } catch (e) { console.error('WC Hunter subscriber error:', e); }
    });
  }

  showToast(message, type = 'info', duration = 3500) {
    const toast = { id: Date.now() + Math.random(), message, type };
    this.activeToasts.push(toast);
    this.notify('TOAST_ADDED', toast);
    setTimeout(() => {
      this.activeToasts = this.activeToasts.filter(t => t.id !== toast.id);
      this.notify('TOAST_REMOVED', toast);
    }, duration);
  }

  // ---- NAVEGACIÓN Y FILTRADO ----

  setTab(tab) {
    this.currentTab = tab;
    // La pestaña "near" es el modo emergencia ("NECESITO WC")
    if (tab === 'near') this.checkAchievement('emergency_caganer');
    this.notify('TAB_CHANGED', tab);
  }

  setIntentFilter(filter) {
    this.intentFilter = filter || null;
    this.notify('FILTER_CHANGED', this.intentFilter);
  }

  setSearchQuery(q) {
    this.searchQuery = String(q || '').trim().toLowerCase();
    this.notify('SEARCH_CHANGED', this.searchQuery);
  }

  openWcDetail(wcId) {
    const found = this.wcs.find(w => w.id === wcId);
    if (found) {
      this.selectedWc = found;
      this.notify('WC_SELECTED', found);
    }
  }

  closeWcDetail() {
    this.selectedWc = null;
    this.notify('WC_DESELECTED', null);
  }

  openAddModal() {
    this.isAddModalOpen = true;
    this.notify('ADD_MODAL_OPEN', true);
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.notify('ADD_MODAL_CLOSE', false);
  }

  // ---- GAMIFICACIÓN ----

  addXP(amount, reason = '') {
    const oldLevel = calculateLevel(this.user.xp).level;
    this.user.xp += amount;
    const newLevelInfo = calculateLevel(this.user.xp);
    this.user.level = newLevelInfo.level;

    this.showToast(`+${amount} XP ${reason ? `· ${reason}` : ''}`, 'xp');

    if (newLevelInfo.level > oldLevel) {
      this.showToast(`🎉 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${newLevelInfo.level}: ${newLevelInfo.rank}`, 'level_up', 5000);
      // Cada nivel desbloquea un nuevo título cosmético
      const nextTitle = UNLOCKED_TITLES_POOL.find(t => !this.user.unlocked_titles.includes(t));
      if (nextTitle) {
        this.user.unlocked_titles.push(nextTitle);
        this.showToast(`🏷️ Nuevo título desbloqueado: ${nextTitle}`, 'info', 4000);
      }
      this.notify('LEVEL_UP', newLevelInfo);
    }

    this.notify('XP_EARNED', { amount, reason, newLevelInfo });
  }

  checkAchievement(achievementId) {
    if (this.user.unlocked_achievements.includes(achievementId)) return;
    const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
    if (!ach) return;
    this.user.unlocked_achievements.push(achievementId);
    this.user.stats.achievements_count = this.user.unlocked_achievements.length;
    this.addXP(ach.xp, `Logro: ${ach.name}`);
    this.showToast(`🏆 ¡LOGRO DESBLOQUEADO!\n${ach.name}`, 'achievement', 5000);
    this.notify('ACHIEVEMENT_UNLOCKED', ach);
  }

  checkMissions(type, count = 1) {
    const MAP = { paper: 'mis_paper_10', clean: 'mis_clean_check', secret: 'mis_secret_hunt' };
    this.missions.forEach(mission => {
      if (mission.completed || MAP[type] !== mission.id) return;
      mission.progress = Math.min(mission.target, mission.progress + count);
      if (mission.progress >= mission.target) {
        mission.completed = true;
        this.addXP(mission.xp_reward, `Misión completada: ${mission.title}`);
        this.showToast(`🎯 ¡Misión cumplida! ${mission.title}`, 'mission', 4000);
      }
    });
  }

  /** Desbloquea los logros basados en contadores cuando su progreso ya esta completo */
  syncProgressAchievements() {
    ['paper_hero', 'clean_inspector', 'secret_master', 'city_explorer'].forEach(id => {
      const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
      if (!ach) return;
      const { current, target } = getAchievementProgress(this.user, ach);
      if (current >= target) this.checkAchievement(id);
    });
  }

  /** Racha diaria: +1 si la ultima actividad fue ayer, reinicia si hubo hueco. */
  touchStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const last = this.user.last_active_date;
    if (last === today) return;
    if (!last) {
      this.user.streak_days = Math.max(1, this.user.streak_days || 0);
    } else {
      const diffDays = Math.round((Date.parse(today) - Date.parse(last)) / 86400000);
      this.user.streak_days = diffDays === 1 ? (this.user.streak_days || 0) + 1 : 1;
    }
    this.user.last_active_date = today;
  }

  /** Registra ciudad/pais visitados y logros de exploracion */
  registerVisit(wc) {
    const city = String(wc.city || '').trim().toLowerCase();
    const country = String(wc.country || '').trim().toLowerCase();
    if (city && !this.user.visited_cities.includes(city)) this.user.visited_cities.push(city);
    if (country && !this.user.visited_countries.includes(country)) this.user.visited_countries.push(country);
    this.user.stats.cities_count = Math.max(this.user.stats.cities_count || 0, this.user.visited_cities.length);
    this.user.stats.countries_count = Math.max(this.user.stats.countries_count || 0, this.user.visited_countries.length);
    if (this.user.visited_cities.length >= 3) this.checkAchievement('city_explorer');
  }

  /** Logros ligados al tipo de lugar, a la hora o a la puntuacion */
  checkContextAchievements(wc) {
    const byType = {
      train: 'railway_caganer',
      stadium: 'stadium_caganer',
      airplane: 'altitude_caganer',
      police_station: 'police_caganer',
      lighthouse: 'lighthouse_caganer'
    };
    if (byType[wc.type]) this.checkAchievement(byType[wc.type]);
    if (wc.score >= 95) this.checkAchievement('vip_caganer');
    if (wc.score < 30) this.checkAchievement('iron_stomach');
    if (new Date().getHours() < 6) this.checkAchievement('night_caganer');
  }

  // ---- WC: VERIFICACIÓN & ALTA ----

  /**
   * Verifica un WC. Devuelve true si se aplico, false si fue rechazada (cooldown).
   * Antifraude: 1 verificacion por WC cada 3 h.
   */
  verifyWC(wcId, report) {
    const wc = this.wcs.find(w => w.id === wcId);
    if (!wc) return false;

    const now = Date.now();
    const last = this.user.verified_log[wcId];
    if (last && now - last < VERIFY_COOLDOWN_MS) {
      const mins = Math.ceil((VERIFY_COOLDOWN_MS - (now - last)) / 60000);
      const wait = mins >= 60 ? `${Math.ceil(mins / 60)} h` : `${mins} min`;
      this.showToast(`⏳ Ya verificaste este WC. Podrás volver a verificarlo en ${wait}.`, 'info', 4000);
      return false;
    }
    const firstTime = !last;
    this.user.verified_log[wcId] = now;

    const closed = report.status === 'closed';
    wc.last_verified_at = new Date(now).toISOString();
    wc.current_status = closed ? 'closed' : 'open';

    // Un reporte de "cerrado" solo cambia el estado: no toca equipamiento ni limpieza.
    if (!closed) {
      if (typeof report.has_paper === 'boolean') {
        wc.equipment.paper = report.has_paper;
        wc.score_breakdown.paper = report.has_paper ? 90 : 30;
        if (report.has_paper) {
          this.user.stats.paper_verifs = (this.user.stats.paper_verifs || 0) + 1;
          this.checkMissions('paper');
        }
      }

      if (typeof report.has_soap === 'boolean') {
        wc.equipment.soap = report.has_soap;
        wc.score_breakdown.soap = report.has_soap ? 85 : 40;
      }

      if (report.cleanliness === 'clean') {
        wc.score_breakdown.cleanliness = Math.min(100, wc.score_breakdown.cleanliness + 5);
        this.user.stats.clean_reports = (this.user.stats.clean_reports || 0) + 1;
        this.checkMissions('clean');
      } else if (report.cleanliness === 'dirty') {
        wc.score_breakdown.cleanliness = Math.max(20, wc.score_breakdown.cleanliness - 15);
      }

      if (report.would_return !== undefined) {
        if (!wc.would_return_ratio) wc.would_return_ratio = { yes: 0, no: 0 };
        if (report.would_return) wc.would_return_ratio.yes += 1;
        else wc.would_return_ratio.no += 1;
      }

      wc.recent_reports.push({ user_id: this.user.id, has_paper: typeof report.has_paper === 'boolean' ? report.has_paper : undefined });
      wc.recent_reports = wc.recent_reports.slice(-MAX_REPORTS_KEPT);
    }

    // Recalcular puntuaciones
    wc.verified_by_count = (wc.verified_by_count || 0) + 1;
    wc.reviews_count = (wc.reviews_count || 0) + 1;
    wc.score = calculateWCScore(wc.score_breakdown);
    wc.confidence = calculateConfidence(wc, wc.recent_reports).confidence;

    // Usuario
    this.touchStreak();
    this.user.stats.verifications_count++;
    if (firstTime) this.user.stats.visited_count++;
    this.registerVisit(wc);
    this.checkAchievement('first_wc');
    this.checkContextAchievements(wc);
    this.syncProgressAchievements();
    this.addXP(calculateXPForAction('VERIFICATION'), 'Verificación rápida');

    this.notify('WC_VERIFIED', wc);
    return true;
  }

  /**
   * Da de alta un WC nuevo. Devuelve true si se creo, false si los datos no son validos.
   */
  addNewWC(data) {
    const name = String(data.name || '').trim().slice(0, 80);
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (!name) {
      this.showToast('⚠️ El WC necesita un nombre.', 'info');
      return false;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      this.showToast('⚠️ Ubicación no válida. Elige un punto en el mapa.', 'info');
      return false;
    }

    const rarityInfo = calculateRarityAndDifficulty(data);
    const isPaid = data.access_type === 'paid';
    const price = isPaid ? Math.max(0, parseFloat(data.price) || 0) : 0;
    const rating = Math.min(5, Math.max(1, Number(data.initial_rating) || 4));
    const base = rating * 20;
    const breakdown = {
      cleanliness: base,
      odor: base,
      paper: data.paper ? 90 : 30,
      soap: data.soap ? 85 : 40,
      privacy: base,
      condition: base,
      price: price > 0 ? 60 : 95
    };

    const newWC = {
      id: `wc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      latitude: lat,
      longitude: lng,
      address: String(data.address || '').trim().slice(0, 120) || 'Ubicación registrada por Hunter',
      city: String(data.city || '').trim().slice(0, 60) || 'Ciudad desconocida',
      country: String(data.country || '').trim().slice(0, 60) || 'País desconocido',
      type: data.type || 'other',
      rarity: rarityInfo.rarity,
      difficulty: rarityInfo.difficulty,
      access_type: data.access_type || 'free',
      access_label: data.access_label || '🆓 Gratuito',
      price,
      opening_hours: data.opening_hours || 'Horario no especificado',
      equipment: {
        paper: data.paper ?? true,
        soap: data.soap ?? true,
        water: true,
        mirror: data.mirror ?? true,
        dryer: data.dryer ?? false,
        baby_changing: data.baby_changing ?? false,
        wheelchair: data.wheelchair ?? false,
        bidet: data.bidet ?? false,
        lock_functional: true
      },
      score_breakdown: breakdown,
      score: calculateWCScore(breakdown),
      confidence: 45,
      current_status: 'open',
      personality_tag: data.is_secret ? '👑 EL PALACIO' : '💎 EL WC PREMIUM',
      personality_desc: String(data.comment || '').trim().slice(0, 280) || 'Nuevo WC descubierto por la comunidad Hunter.',
      last_verified_at: new Date().toISOString(),
      would_return_ratio: { yes: 1, no: 0 },
      is_secret: Boolean(data.is_secret),
      photos: [],
      creator_name: this.user.username,
      discovered_by: this.user.username,
      discovered_date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      reviews_count: 1,
      verified_by_count: 1,
      recent_reports: []
    };
    newWC.confidence = calculateConfidence(newWC).confidence;

    this.wcs.unshift(newWC);
    this.touchStreak();
    this.user.stats.discovered_count++;
    this.user.stats.visited_count++;
    this.user.verified_log[newWC.id] = Date.now();

    // Limite diario de XP por descubrimientos (antifraude)
    const now = Date.now();
    this.user.discovery_log = this.user.discovery_log.filter(t => now - t < 86400000);
    this.user.discovery_log.push(now);
    const xpAllowed = this.user.discovery_log.length <= DISCOVERY_XP_PER_DAY;

    this.registerVisit(newWC);
    this.checkAchievement('first_wc');
    this.checkContextAchievements(newWC);

    if (newWC.is_secret) {
      this.user.stats.secrets_found++;
      this.checkMissions('secret');
    }
    this.syncProgressAchievements();

    if (xpAllowed) {
      this.addXP(calculateXPForAction('DISCOVERY'), 'Descubrimiento original de WC');
      if (newWC.is_secret) this.addXP(calculateXPForAction('SECRET_WC_FOUND'), 'Descubrimiento de WC Secreto');
      if (newWC.rarity !== 'COMMON') {
        this.addXP(calculateXPForAction('RARE_WC_FOUND', { rarity: newWC.rarity }), `WC ${newWC.rarity}`);
      }
    } else {
      this.showToast(`⏳ Límite diario de XP por descubrimientos alcanzado (${DISCOVERY_XP_PER_DAY}/24 h). El WC se publica igualmente.`, 'info', 5000);
    }

    this.closeAddModal();
    this.showToast(`🎉 ¡WC "${newWC.name}" añadido con éxito!`, 'success', 4000);
    this.openWcDetail(newWC.id);
    this.notify('WC_CREATED', newWC);
    return true;
  }

  // Filtra la lista de WCs según búsqueda e intención
  getFilteredWCs() {
    let list = [...this.wcs];

    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q) ||
        w.country.toLowerCase().includes(q) ||
        w.address.toLowerCase().includes(q) ||
        w.type.toLowerCase().includes(q) ||
        (w.personality_tag && w.personality_tag.toLowerCase().includes(q))
      );
    }

    switch (this.intentFilter) {
      case 'clean':
        list.sort((a, b) => (b.score_breakdown?.cleanliness || 0) - (a.score_breakdown?.cleanliness || 0));
        break;
      case 'free':
        list = list.filter(w => w.access_type === 'free' || w.price === 0);
        list.sort((a, b) => b.score - a.score);
        break;
      case 'private':
        list.sort((a, b) => (b.score_breakdown?.privacy || 0) - (a.score_breakdown?.privacy || 0));
        break;
      case 'equipped':
        list = list.filter(w => w.equipment.paper && w.equipment.soap);
        list.sort((a, b) => b.score - a.score);
        break;
      case 'baby':
        list = list.filter(w => w.equipment.baby_changing);
        break;
      case 'accessible':
        list = list.filter(w => w.equipment.wheelchair);
        break;
      case 'secret':
        list = list.filter(w => w.is_secret);
        break;
    }

    return list;
  }
}

export const store = new Store();
