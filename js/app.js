/**
 * WC HUNTER — Orquestador de la Aplicación V2.0
 */
import { store } from './state.js';
import { renderMapView } from './views/mapView.js';
import { renderNearView } from './views/nearView.js';
import { renderRankingView } from './views/rankingView.js';
import { renderHunterView } from './views/hunterView.js';
import { renderProfileView } from './views/profileView.js';
import { renderWcDetailModal } from './views/wcDetailModal.js';
import { renderAddWcModal } from './views/addWcModal.js';

class App {
  constructor() {
    this.viewContainer = document.getElementById('view-container');
    this.modalContainer = document.getElementById('modal-container');
    this.addModalContainer = document.getElementById('add-modal-container');
    this.toastContainer = document.getElementById('toast-container');
    this.navButtons = document.querySelectorAll('.nav-tab-btn, .sidebar-link');

    this.audioCtx = null;
    this.initAudio();
    this.bindEvents();
    this.subscribeToStore();
    this.updateSidebarUserCard();
    this.renderCurrentView();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {}
  }

  playSound(type = 'click') {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (type === 'xp') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'achievement') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'emergency') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  bindEvents() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        store.setTab(tab);
      });
    });

    const sidebarAddBtn = document.getElementById('sidebar-add-wc-btn');
    if (sidebarAddBtn) {
      sidebarAddBtn.addEventListener('click', () => {
        store.openAddModal();
      });
    }

    const userCard = document.getElementById('sidebar-user-card');
    if (userCard) {
      userCard.addEventListener('click', () => {
        store.setTab('profile');
      });
    }
  }

  subscribeToStore() {
    store.subscribe((event, payload) => {
      if (event === 'TAB_CHANGED') {
        this.updateNavTabs(payload);
        this.renderCurrentView();
      } else if (event === 'WC_SELECTED' || event === 'WC_DESELECTED' || event === 'WC_VERIFIED') {
        renderWcDetailModal(this.modalContainer);
      } else if (event === 'ADD_MODAL_OPEN' || event === 'ADD_MODAL_CLOSE' || event === 'WC_CREATED') {
        renderAddWcModal(this.addModalContainer);
      } else if (event === 'XP_EARNED') {
        this.playSound('xp');
        this.updateSidebarUserCard();
      } else if (event === 'ACHIEVEMENT_UNLOCKED') {
        this.playSound('achievement');
      } else if (event === 'EMERGENCY_TOGGLED') {
        if (payload) this.playSound('emergency');
        this.renderCurrentView();
      } else if (event === 'TOAST_ADDED' || event === 'TOAST_REMOVED') {
        this.renderToasts();
      }
    });
  }

  updateNavTabs(activeTab) {
    this.navButtons.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateSidebarUserCard() {
    const user = store.user;
    const avatarEl = document.getElementById('sidebar-avatar');
    const userEl = document.getElementById('sidebar-username');
    const titleEl = document.getElementById('sidebar-title');
    const streakEl = document.getElementById('sidebar-streak');

    if (avatarEl) avatarEl.textContent = user.avatar;
    if (userEl) userEl.textContent = user.username;
    if (titleEl) titleEl.textContent = user.title;
    if (streakEl) streakEl.textContent = `🔥 ${user.streak_days}d`;
  }

  renderCurrentView() {
    this.updateNavTabs(store.currentTab);

    switch (store.currentTab) {
      case 'map':
        renderMapView(this.viewContainer);
        break;
      case 'near':
        renderNearView(this.viewContainer);
        break;
      case 'rankings':
        renderRankingView(this.viewContainer);
        break;
      case 'hunter':
        renderHunterView(this.viewContainer);
        break;
      case 'profile':
        renderProfileView(this.viewContainer);
        break;
      default:
        renderMapView(this.viewContainer);
    }
  }

  renderToasts() {
    if (!this.toastContainer) return;
    this.toastContainer.innerHTML = store.activeToasts.map(t => {
      let icon = 'ℹ️';
      let extraClass = '';
      if (t.type === 'xp') icon = '⭐';
      else if (t.type === 'achievement') { icon = '🏆'; extraClass = 'toast-achievement'; }
      else if (t.type === 'emergency') { icon = '🚨'; extraClass = 'toast-emergency'; }
      else if (t.type === 'level_up') { icon = '🎉'; extraClass = 'toast-achievement'; }
      else if (t.type === 'success') icon = '✅';

      return `
        <div class="toast ${extraClass}">
          <span class="text-base">${icon}</span>
          <span style="white-space: pre-line;">${t.message}</span>
        </div>
      `;
    }).join('');
  }
}

function bootApp() {
  if (window.wcHunterApp) return;
  try {
    window.wcHunterApp = new App();
    console.log("✅ WC HUNTER V2.0 iniciado correctamente.");
  } catch (err) {
    console.error("❌ Error iniciando WC HUNTER:", err);
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;color:#fff;background:#080c14;">
          <div style="font-size:48px;margin-bottom:12px;">🚽</div>
          <h2 style="font-size:18px;font-weight:900;margin-bottom:8px;">WC HUNTER</h2>
          <p style="font-size:12px;color:#94a3b8;margin-bottom:16px;">Ocurrió un error al cargar la vista. Pulsa para reintentar:</p>
          <button onclick="window.location.reload(true)" style="background:#f59e0b;color:#000;font-weight:800;font-size:13px;padding:10px 20px;border-radius:12px;border:none;cursor:pointer;">
            🔄 Recargar App
          </button>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
