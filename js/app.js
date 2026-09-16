/**
 * WC HUNTER — Orquestador de la Aplicación V1.0
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
    this.navButtons = document.querySelectorAll('.nav-tab-btn');

    this.audioCtx = null;
    this.initAudio();
    this.bindEvents();
    this.subscribeToStore();
    this.renderCurrentView();
  }

  // Sintetizador Web Audio API para micro-feedback de sonido sin dependencias
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.log('Web Audio no disponible:', e);
    }
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
      // Tono ascendente para XP
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'achievement') {
      // Fanfarria breve de logro
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'emergency') {
      // Alarma de emergencia
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
      } else if (event === 'ACHIEVEMENT_UNLOCKED') {
        this.playSound('achievement');
      } else if (event === 'EMERGENCY_TOGGLED') {
        if (payload) this.playSound('emergency');
        this.renderCurrentView();
      } else if (event === 'TOAST_ADDED' || event === 'TOAST_REMOVED') {
        this.renderToasts();
      } else if (event === 'FILTER_CHANGED' || event === 'SEARCH_CHANGED') {
        // En ciertas vistas se re-renderiza localmente
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

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.wcHunterApp = new App();
});
