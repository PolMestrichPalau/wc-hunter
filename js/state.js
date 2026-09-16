/**
 * WC HUNTER — State Manager & Store Reactivo Local-First
 */
import { INITIAL_USER, INITIAL_WCS, ACHIEVEMENTS_CATALOG, MISSIONS_LIST, COLLECTIONS } from './seedData.js';
import { calculateUserLevel, calculateConfidence, calculateWCScore, calculateRarityAndDifficulty, calculateXPForAction } from './algorithms.js';

const STORAGE_KEY = 'wc_hunter_state_v2';

class Store {
  constructor() {
    this.subscribers = [];
    this.loadState();
  }

  loadState() {
    try {
      localStorage.removeItem('wc_hunter_state_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.wcs = parsed.wcs || INITIAL_WCS;
        this.user = parsed.user || INITIAL_USER;
        this.missions = parsed.missions || MISSIONS_LIST;
        this.collections = parsed.collections || COLLECTIONS;
      } else {
        this.resetToDefaults();
      }
    } catch (e) {
      console.warn('Error cargando estado de localStorage:', e);
      this.resetToDefaults();
    }

    // Estado efímero de sesión
    this.currentTab = 'map';
    this.emergencyMode = false;
    this.intentFilter = null;
    this.searchQuery = '';
    this.selectedWc = null;
    this.isAddModalOpen = false;
    this.activeToasts = [];
    this.userLocation = { lat: 40.4168, lng: -3.7038, name: "Madrid (Sol)" }; // fallback inicial
  }

  resetToDefaults() {
    this.wcs = JSON.parse(JSON.stringify(INITIAL_WCS));
    this.user = JSON.parse(JSON.stringify(INITIAL_USER));
    this.missions = JSON.parse(JSON.stringify(MISSIONS_LIST));
    this.collections = JSON.parse(JSON.stringify(COLLECTIONS));
    this.saveState();
  }

  saveState() {
    try {
      const toSave = {
        wcs: this.wcs,
        user: this.user,
        missions: this.missions,
        collections: this.collections
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, payload) {
    this.saveState();
    this.subscribers.forEach(cb => cb(event, payload));
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

  // ---- ACCIONES DE NAVEGACIÓN Y FILTRADO ----

  setTab(tab) {
    this.currentTab = tab;
    this.notify('TAB_CHANGED', tab);
  }

  setIntentFilter(filter) {
    this.intentFilter = this.intentFilter === filter ? null : filter;
    this.notify('FILTER_CHANGED', this.intentFilter);
  }

  setSearchQuery(q) {
    this.searchQuery = q.trim().toLowerCase();
    this.notify('SEARCH_CHANGED', this.searchQuery);
  }

  toggleEmergencyMode() {
    this.emergencyMode = !this.emergencyMode;
    if (this.emergencyMode) {
      this.showToast('🚨 MODO EMERGENCIA: Priorizando WC abiertos, gratis y con papel', 'emergency', 4500);
      this.setTab('near');
      this.checkAchievement('emergency_caganer');
    }
    this.notify('EMERGENCY_TOGGLED', this.emergencyMode);
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

  // ---- ACCIONES DE GAMIFICACIÓN ----

  addXP(amount, reason = '') {
    const oldLevel = calculateUserLevel(this.user.xp).level;
    this.user.xp += amount;
    const newLevelInfo = calculateUserLevel(this.user.xp);

    this.showToast(`+${amount} XP ${reason ? `· ${reason}` : ''}`, 'xp');

    if (newLevelInfo.level > oldLevel) {
      this.user.level = newLevelInfo.level;
      this.showToast(`🎉 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${newLevelInfo.level}: ${newLevelInfo.rankTitle}`, 'level_up', 5000);
      this.notify('LEVEL_UP', newLevelInfo);
    }

    this.notify('XP_EARNED', { amount, reason, newLevelInfo });
  }

  checkAchievement(achievementId) {
    if (!this.user.unlocked_achievements.includes(achievementId)) {
      const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === achievementId);
      if (ach) {
        this.user.unlocked_achievements.push(achievementId);
        this.user.stats.achievements_count++;
        this.addXP(ach.xp, `Logro: ${ach.name}`);
        this.showToast(`🏆 ¡LOGRO DESBLOQUEADO!\n${ach.name}`, 'achievement', 5000);
        this.notify('ACHIEVEMENT_UNLOCKED', ach);
      }
    }
  }

  checkMissions(type, count = 1) {
    this.missions.forEach(mission => {
      if (!mission.completed) {
        if (type === 'paper' && mission.id === 'mis_paper_10') {
          mission.progress = Math.min(mission.target, mission.progress + count);
        } else if (type === 'clean' && mission.id === 'mis_clean_check') {
          mission.progress = Math.min(mission.target, mission.progress + count);
        } else if (type === 'secret' && mission.id === 'mis_secret_hunt') {
          mission.progress = Math.min(mission.target, mission.progress + count);
        }

        if (mission.progress >= mission.target) {
          mission.completed = true;
          this.addXP(mission.xp_reward, `Misión completada: ${mission.title}`);
          this.showToast(`🎯 ¡Misión cumplida! ${mission.title}`, 'mission', 4000);
        }
      }
    });
  }

  // ---- ACCIONES DE WC (VERIFICACIÓN & ALTA) ----

  verifyWC(wcId, report) {
    const wc = this.wcs.find(w => w.id === wcId);
    if (!wc) return;

    wc.last_verified_at = new Date().toISOString();
    wc.current_status = report.status || 'open';

    if (report.has_paper !== undefined) {
      wc.equipment.paper = report.has_paper;
      if (report.has_paper) {
        this.checkMissions('paper');
        this.checkAchievement('paper_hero');
      }
    }

    if (report.has_soap !== undefined) {
      wc.equipment.soap = report.has_soap;
    }

    if (report.cleanliness) {
      if (report.cleanliness === 'clean') wc.score_breakdown.cleanliness = Math.min(100, (wc.score_breakdown.cleanliness || 80) + 5);
      if (report.cleanliness === 'dirty') wc.score_breakdown.cleanliness = Math.max(20, (wc.score_breakdown.cleanliness || 80) - 15);
      this.checkMissions('clean');
      this.checkAchievement('clean_inspector');
    }

    if (report.would_return !== undefined) {
      if (!wc.would_return_ratio) wc.would_return_ratio = { yes: 10, no: 1 };
      if (report.would_return) wc.would_return_ratio.yes += 1;
      else wc.would_return_ratio.no += 1;
    }

    // Recalcular puntuaciones
    wc.score = calculateWCScore(wc.score_breakdown);
    const confObj = calculateConfidence(wc, [{ user_id: this.user.id, has_paper: report.has_paper }]);
    wc.confidence = confObj.confidence;
    wc.reviews_count = (wc.reviews_count || 10) + 1;

    // Actualizar usuario
    this.user.stats.verifications_count++;
    this.checkAchievement('first_wc');
    this.addXP(calculateXPForAction('VERIFICATION'), 'Verificación rápida');

    this.notify('WC_VERIFIED', wc);
  }

  addNewWC(data) {
    const rarityInfo = calculateRarityAndDifficulty(data);
    const newWC = {
      id: `wc_${Date.now()}`,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || 'Ubicación registrada por Hunter',
      city: data.city || 'Madrid',
      country: 'España',
      type: data.type || 'other',
      rarity: rarityInfo.rarity,
      difficulty: rarityInfo.difficulty,
      access_type: data.access_type || 'free',
      access_label: data.access_label || '🆓 Gratuito',
      price: parseFloat(data.price) || 0.0,
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
      score: data.initial_rating ? data.initial_rating * 20 : 80,
      score_breakdown: {
        cleanliness: data.cleanliness ?? 80,
        odor: 80,
        paper: data.paper ? 90 : 30,
        soap: data.soap ? 85 : 40,
        privacy: 80,
        condition: 80,
        price: data.price > 0 ? 60 : 95
      },
      confidence: 75,
      current_status: 'open',
      personality_tag: data.is_secret ? '👑 EL PALACIO' : '💎 EL WC PREMIUM',
      personality_desc: data.comment || 'Nuevo WC descubierto por la comunidad Hunter.',
      last_verified_at: new Date().toISOString(),
      would_return_ratio: { yes: 1, no: 0 },
      is_secret: Boolean(data.is_secret),
      photos: data.photo_url ? [{
        url: data.photo_url,
        caption: 'Foto aportada por el descubridor',
        uploaded_at: new Date().toISOString(),
        category: 'general'
      }] : [],
      creator_name: this.user.username,
      reviews_count: 1
    };

    this.wcs.unshift(newWC);
    this.user.stats.discovered_count++;
    
    // XP y logros por descubrimiento
    this.addXP(calculateXPForAction('DISCOVERY'), 'Descubrimiento original de WC');
    if (newWC.is_secret) {
      this.user.stats.secrets_found++;
      this.checkMissions('secret');
      this.checkAchievement('secret_master');
      this.addXP(calculateXPForAction('SECRET_WC_FOUND'), 'Descubrimiento de WC Secreto');
    }
    if (newWC.rarity !== 'COMMON') {
      this.addXP(calculateXPForAction('RARE_WC_FOUND', { rarity: newWC.rarity }), `WC ${newWC.rarity}`);
    }

    this.closeAddModal();
    this.showToast(`🎉 ¡WC "${newWC.name}" añadido con éxito!`, 'success', 4000);
    this.openWcDetail(newWC.id);
    this.notify('WC_CREATED', newWC);
  }

  // Filtra la lista de WCs según búsqueda, intención o emergencia
  getFilteredWCs() {
    let list = [...this.wcs];

    // Búsqueda textual
    if (this.searchQuery) {
      list = list.filter(w => 
        w.name.toLowerCase().includes(this.searchQuery) ||
        w.city.toLowerCase().includes(this.searchQuery) ||
        w.address.toLowerCase().includes(this.searchQuery) ||
        w.type.toLowerCase().includes(this.searchQuery) ||
        (w.personality_tag && w.personality_tag.toLowerCase().includes(this.searchQuery))
      );
    }

    // Modo emergencia
    if (this.emergencyMode) {
      list = list.filter(w => w.current_status !== 'closed');
      list.sort((a, b) => {
        // En emergencia: abiertos > gratis > limpios con papel > score
        const scoreA = (a.access_type === 'free' ? 50 : 0) + (a.equipment.paper ? 30 : 0) + (a.score || 0);
        const scoreB = (b.access_type === 'free' ? 50 : 0) + (b.equipment.paper ? 30 : 0) + (b.score || 0);
        return scoreB - scoreA;
      });
      return list;
    }

    // Filtros por intención
    if (this.intentFilter) {
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
    }

    return list;
  }
}

export const store = new Store();
