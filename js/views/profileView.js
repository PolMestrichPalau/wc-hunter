/**
 * WC HUNTER — Vista Perfil & Récords Personales V2.0
 */
import { store } from '../state.js';
import { AVATAR_POOL } from '../seedData.js';
import { calculateLevel } from '../engines/gameEngine.js';
import { computeUserRecords, generateUserNickname } from '../engines/userEngine.js';
import { esc } from '../utils.js';
import { backend, describeError } from '../backend.js';
import { openQrShareModal, openFeedbackModal } from './feedbackModal.js';

export function renderProfileView(container) {
  const user = store.user;
  const levelInfo = calculateLevel(user.xp);
  const autoNick = generateUserNickname(user);
  const records = computeUserRecords(store.wcs, user, store.userLocation);
  const favWcs = store.wcs.filter(w => store.isFavorite(w.id));

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      <!-- Cabecera del Perfil -->
      <div class="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 px-6 pt-6 pb-5 flex flex-col items-center text-center">
        <div class="relative mb-3">
          <div class="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
            ${esc(user.avatar)}
          </div>
          <span class="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-slate-900">
            Nv. ${levelInfo.level}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-black text-white">${esc(user.username)}</h1>
          <button id="rename-btn" class="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 px-2 py-1 rounded-lg border border-slate-700 transition" title="Cambiar nombre">
            ✏️ Editar
          </button>
        </div>
        <p class="text-xs text-amber-400 font-extrabold mt-0.5 tracking-wide">${esc(user.title)}</p>
        <span class="text-[11px] text-slate-400 italic mt-1">"${esc(autoNick)}"</span>

        <!-- Selector rápido de Avatar -->
        <div class="flex items-center gap-1.5 mt-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-1.5 overflow-x-auto max-w-full no-scrollbar">
          <span class="text-[10px] font-black uppercase text-slate-500 mr-1">Avatar:</span>
          ${AVATAR_POOL.map(av => `
            <button type="button" data-avatar-pick="${esc(av)}" class="w-8 h-8 rounded-xl flex items-center justify-center text-base transition ${user.avatar === av ? 'bg-amber-500/25 border border-amber-400 scale-110' : 'hover:bg-slate-800 opacity-75 hover:opacity-100'}">
              ${esc(av)}
            </button>
          `).join('')}
        </div>

        <div class="mt-3 flex items-center gap-2 flex-wrap justify-center">
          <div class="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
            <span class="text-sm">🛡️</span>
            <span class="text-xs font-bold text-emerald-300">Reputación: <strong>${esc(user.reputation)}% Fiable</strong></span>
          </div>
          <button type="button" id="generate-card-btn" class="tactile-amber-btn bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95">
            <span>🪪</span>
            <span>Carnet Hunter</span>
          </button>
          <button type="button" id="toggle-sound-btn" class="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition">
            <span>${user.sound_enabled !== false ? '🔊' : '🔇'}</span>
            <span>Sonido: ${user.sound_enabled !== false ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <div class="px-4 sm:px-6 py-5 flex flex-col gap-5 max-w-4xl mx-auto w-full">

        <!-- 0. ❤️ MIS TRONOS FAVORITOS GUARDADOS -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>❤️</span>
              <span>Mis WC Favoritos Guardados (${favWcs.length})</span>
            </h2>
            <span class="text-xs text-rose-400 font-bold">Acceso Rápido</span>
          </div>

          ${favWcs.length === 0 ? `
            <p class="text-xs text-slate-400 italic py-2">Aún no has guardado ningún baño en favoritos. Pulsa el icono 🤍 en el mapa o en la ficha de cualquier WC para guardarlo aquí.</p>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${favWcs.map(wc => `
                <div class="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-rose-500/40 rounded-2xl p-3 flex items-center justify-between gap-2.5 cursor-pointer fav-wc-card transition" data-wc-id="${esc(wc.id)}">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-black text-white truncate">${esc(wc.name)}</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate mt-0.5">📍 ${esc(wc.address)}, ${esc(wc.city)}</p>
                  </div>
                  <span class="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                    ${wc.unrated ? '?' : esc(wc.score)} pts
                  </span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        
        <!-- 1. 💩 MIS RÉCORDS PERSONALES -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>💩</span>
              <span>Mis Récords Personales</span>
            </h2>
            <span class="text-xs text-amber-400 font-bold">Logros de Vida</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>🔴</span> <span>WC Más Raro</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.rarestWc.name)}</span>
                <span class="text-xs text-rose-400 font-extrabold">Rareza: ${esc(records.rarestWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded w-max border border-rose-500/30">
                ${esc(records.rarestWc.tag)}
              </span>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>🧼</span> <span>WC Más Limpio</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.cleanestWc.name)}</span>
                <span class="text-xs text-emerald-400 font-extrabold">Puntuación: ${esc(records.cleanestWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded w-max border border-emerald-500/30">
                ${esc(records.cleanestWc.tag)}
              </span>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>👃</span> <span>WC Con Peor Olor</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.worstOdorWc.name)}</span>
                <span class="text-xs text-amber-400 font-extrabold">Olor: ${esc(records.worstOdorWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded w-max border border-amber-500/30">
                ${esc(records.worstOdorWc.tag)}
              </span>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>💰</span> <span>WC Más Caro Pagado</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.mostExpensiveWc.name)}</span>
                <span class="text-xs text-blue-400 font-extrabold">Precio: ${esc(records.mostExpensiveWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded w-max border border-blue-500/30">
                ${esc(records.mostExpensiveWc.tag)}
              </span>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>✈️</span> <span>WC A Mayor Altura</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.highestAltitudeWc.name)}</span>
                <span class="text-xs text-purple-400 font-extrabold">Altitud: ${esc(records.highestAltitudeWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded w-max border border-purple-500/30">
                ${esc(records.highestAltitudeWc.tag)}
              </span>
            </div>

            <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <span>🌍</span> <span>WC Más Lejano</span>
              </span>
              <div class="my-2">
                <span class="text-sm font-black text-white block truncate">${esc(records.farthestWc.name)}</span>
                <span class="text-xs text-cyan-400 font-extrabold">Distancia: ${esc(records.farthestWc.score)}</span>
              </div>
              <span class="text-[10px] font-black uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded w-max border border-cyan-500/30">
                ${esc(records.farthestWc.tag)}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. SELECTOR DE TÍTULOS DESBLOQUEABLES -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <h2 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>🏷️</span>
            <span>Títulos Desbloqueados</span>
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${user.unlocked_titles.map((t, i) => {
              const isSelected = t === user.title;
              return `
                <button class="title-pick-btn p-3 rounded-2xl border ${isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black shadow-sm' : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white font-bold'} text-left text-xs transition flex items-center justify-between" data-title-idx="${i}">
                  <span>${esc(t)}</span>
                  ${isSelected ? `<span class="text-xs">✓ Activo</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. ESTADÍSTICAS GENERALES -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <h2 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>📊</span>
            <span>Estadísticas de Explorador</span>
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">WC Visitados</span>
              <span class="text-xl font-black text-white block mt-1">${user.stats.visited_count}</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">WC Descubiertos</span>
              <span class="text-xl font-black text-amber-400 block mt-1">${user.stats.discovered_count}</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">Verificaciones</span>
              <span class="text-xl font-black text-emerald-400 block mt-1">${user.stats.verifications_count}</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">Ciudades</span>
              <span class="text-xl font-black text-blue-400 block mt-1">${user.stats.cities_count}</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">Países</span>
              <span class="text-xl font-black text-purple-400 block mt-1">${user.stats.countries_count}</span>
            </div>
            <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
              <span class="text-[11px] font-bold text-slate-400">WC Secretos</span>
              <span class="text-xl font-black text-rose-400 block mt-1">${user.stats.secrets_found}</span>
            </div>
          </div>
        </div>

        <!-- 4. 🚀 ZONA BETA TESTERS & INVITAR CON QR -->
        <div class="bg-gradient-to-r from-slate-900 via-surface-container to-slate-900 border border-emerald-500/30 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span>🚀</span>
              <span>Zona Beta Testers & Compartir</span>
            </h2>
            <span class="text-xs text-amber-400 font-bold">+20 XP Feedback</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button id="profile-qr-btn" type="button" class="bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-black text-xs py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow">
              <span class="text-xl">📲</span>
              <span>Invitar Probadores con QR</span>
            </button>
            <button id="profile-feedback-btn" type="button" class="bg-slate-800/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-black text-xs py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow">
              <span class="text-xl">💬</span>
              <span>Buzón de Feedback (+20 XP)</span>
            </button>
          </div>
        </div>

        <!-- 5. ⚙️ PWA & COPIA DE SEGURIDAD -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3.5 shadow-md">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>⚙️</span>
              <span>App PWA & Copia de Seguridad</span>
            </h2>
            <span class="text-xs text-cyan-400 font-bold">Local-First</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button id="pwa-install-btn" type="button" class="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-slate-950 font-black text-xs p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow transition active:scale-95 text-center">
              <span class="text-2xl">📲</span>
              <span>Instalar en Pantalla</span>
              <span class="text-[9px] font-bold text-slate-900/80">Abrir sin barras de navegador</span>
            </button>
            <button id="export-backup-btn" type="button" class="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xs p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow transition active:scale-95 text-center">
              <span class="text-2xl">💾</span>
              <span>Exportar Partida</span>
              <span class="text-[9px] font-bold text-slate-400">Descargar copia .json</span>
            </button>
            <label class="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xs p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow transition active:scale-95 text-center cursor-pointer">
              <span class="text-2xl">📂</span>
              <span>Restaurar Partida</span>
              <span class="text-[9px] font-bold text-slate-400">Importar archivo .json</span>
              <input type="file" id="import-backup-file" accept=".json,application/json" class="hidden" />
            </label>
          </div>
        </div>

      </div>
    </div>
  `;

  // Cambiar nombre público (en modo comunidad y en modo local)
  container.querySelector('#rename-btn')?.addEventListener('click', async () => {
    const wanted = window.prompt('Tu nombre público de Cazador (3-24 caracteres):', user.username);
    if (!wanted) return;
    const clean = wanted.trim().slice(0, 24);
    if (clean.length < 3 || clean === user.username) return;
    if (store.remote) {
      try {
        store.applyRemoteProfile(await backend.setProfile({ username: clean }));
        store.notify('USER_UPDATED', store.user);
        store.showToast('✏️ Nombre actualizado', 'success');
        renderProfileView(container);
      } catch (e) {
        store.showToast(describeError(e).message, 'info');
      }
    } else {
      user.username = clean;
      store.notify('USER_UPDATED', user);
      store.showToast(`✏️ Ahora te llamas @${clean}`, 'success');
      renderProfileView(container);
    }
  });

  // Selector de avatar
  container.querySelectorAll('[data-avatar-pick]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const av = btn.getAttribute('data-avatar-pick');
      if (!av || av === user.avatar) return;
      if (store.remote) {
        try {
          store.applyRemoteProfile(await backend.setProfile({ avatar: av }));
        } catch (e) {}
      }
      user.avatar = av;
      store.notify('USER_UPDATED', user);
      store.showToast(`${av} Avatar actualizado`, 'info', 2000);
      renderProfileView(container);
    });
  });

  // Toggle de sonido
  container.querySelector('#toggle-sound-btn')?.addEventListener('click', () => {
    store.toggleSound();
    renderProfileView(container);
  });

  // Generador de Carnet Oficial Hunter
  container.querySelector('#generate-card-btn')?.addEventListener('click', () => {
    generateAndShowHunterCard(user, levelInfo);
  });

  // Zona Beta Testers: QR & Feedback
  container.querySelector('#profile-qr-btn')?.addEventListener('click', () => {
    openQrShareModal();
  });

  container.querySelector('#profile-feedback-btn')?.addEventListener('click', () => {
    openFeedbackModal();
  });

  // PWA Instalación
  container.querySelector('#pwa-install-btn')?.addEventListener('click', async () => {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt();
      const choice = await window.deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        store.showToast('📲 ¡WC Hunter instalado en tu pantalla!', 'success');
      }
      window.deferredInstallPrompt = null;
    } else {
      // Instrucciones universales para iPhone Safari / Chrome
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIos) {
        window.alert('Para instalar en iPhone/iPad:\n1. Pulsa el botón "Compartir" 📤 en Safari\n2. Elige "Añadir a pantalla de inicio" 📲');
      } else {
        store.showToast('ℹ️ En el menú de tu navegador (⋮), pulsa "Instalar aplicación" o "Añadir a pantalla de inicio".', 'info', 5000);
      }
    }
  });

  // Exportar Copia de Seguridad JSON
  container.querySelector('#export-backup-btn')?.addEventListener('click', () => {
    store.exportBackupJson();
  });

  // Importar y Restaurar Copia de Seguridad JSON
  container.querySelector('#import-backup-file')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const ok = store.importBackupJson(evt.target.result);
      if (ok) renderProfileView(container);
    };
    reader.readAsText(file);
  });

  // Abrir ficha desde Mis Favoritos
  container.querySelectorAll('.fav-wc-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-wc-id');
      if (id) store.openWcDetail(id);
    });
  });

  // Attach event listeners for title pick
  const titleBtns = container.querySelectorAll('.title-pick-btn');
  titleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = user.unlocked_titles[Number(btn.getAttribute('data-title-idx'))];
      if (!chosen) return;
      user.title = chosen;
      // BUG-10: usar notify para que app.js actualice el sidebar inmediatamente
      store.notify('USER_UPDATED', user);
      store.showToast(`🏷️ Título cambiado a: ${chosen}`, 'info');
      renderProfileView(container);
    });
  });
}

/**
 * Genera el Carnet Oficial de Cazador mediante Canvas 2D y abre el visor de descarga/compartir.
 */
function generateAndShowHunterCard(user, levelInfo) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 430;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fondo degradado cyberpunk oscuro
  const bgGrad = ctx.createLinearGradient(0, 0, 720, 430);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#090d16');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 430);

  // Rejilla táctica tenue
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 720; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 430);
    ctx.stroke();
  }
  for (let y = 0; y < 430; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(720, y);
    ctx.stroke();
  }

  // Marco exterior neón
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, 688, 398);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, 676, 386);

  // Cabecera
  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('WC HUNTER · LICENCIA OFICIAL DE CAZADOR DE TRONOS', 40, 52);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('URBAN SANITATION RADAR · DIVISIÓN DE EXPLORACIÓN', 40, 68);

  // Línea divisoria cabecera
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(40, 80);
  ctx.lineTo(680, 80);
  ctx.stroke();

  // Contenedor Avatar
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.fillRect(40, 100, 130, 150);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 100, 130, 150);

  ctx.font = '74px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(user.avatar || '🧔‍♂️', 105, 185);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(40, 224, 130, 26);
  ctx.fillStyle = '#020617';
  ctx.font = '900 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`NIVEL ${levelInfo.level}`, 105, 241);

  // Datos del Cazador
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`@${user.username}`, 195, 128);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(user.title || 'Iniciado del Retrete', 195, 150);

  ctx.fillStyle = '#06b6d4';
  ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Rango: ${levelInfo.rank}`, 195, 170);

  // Tabla de Estadísticas
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(195, 188, 320, 105);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(195, 188, 320, 105);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`🔥 Racha: ${user.streak_days} días consecutivos`, 210, 212);
  ctx.fillText(`⚡ Experiencia Total: ${user.xp.toLocaleString()} XP`, 210, 235);
  ctx.fillText(`🚽 Baños Verificados: ${user.stats.verifications_count} check-ins`, 210, 258);
  ctx.fillText(`🗺️ Ciudades Cazadas: ${user.stats.cities_count || 1} ciudades`, 210, 281);

  // Sello Holográfico Circular
  ctx.save();
  ctx.translate(600, 210);
  ctx.rotate(-0.2);
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.font = '900 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', 0, -12);
  ctx.fillStyle = '#10b981';
  ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('HUNTER', 0, 4);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('100% OFICIAL', 0, 20);
  ctx.restore();

  // Pie de tarjeta
  ctx.fillStyle = '#64748b';
  ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  const serial = `SERIE: WCH-${Math.abs(user.username.split('').reduce((a,c)=>a+c.charCodeAt(0),0))}-${levelInfo.level}X`;
  ctx.fillText(serial, 40, 390);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#10b981';
  ctx.fillText('https://polmestrichpalau.github.io/wc-hunter/', 680, 390);

  const dataUrl = canvas.toDataURL('image/png');

  // Abrir modal de vista previa del carnet
  const modalWrap = document.createElement('div');
  modalWrap.className = 'fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-slide-up';
  modalWrap.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-xl w-full shadow-2xl flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-black text-white flex items-center gap-2">
          <span>🪪</span> <span>Tu Carnet Oficial de Cazador</span>
        </h3>
        <button id="close-card-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white font-bold flex items-center justify-center transition">✕</button>
      </div>
      <div class="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-950 flex items-center justify-center">
        <img src="${dataUrl}" alt="Carnet Oficial Hunter" class="w-full h-auto object-contain" />
      </div>
      <div class="flex items-center gap-2.5">
        <a href="${dataUrl}" download="carnet-hunter-${esc(user.username)}.png" class="tactile-amber-btn flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
          <span>⬇️</span> <span>Descargar Carnet (PNG)</span>
        </a>
        <button id="share-card-btn" class="bg-slate-800 hover:bg-slate-700 text-white font-black text-xs py-3 px-4 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition">
          <span>📤</span> <span>Compartir</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalWrap);

  modalWrap.querySelector('#close-card-modal-btn')?.addEventListener('click', () => modalWrap.remove());
  modalWrap.addEventListener('click', (e) => { if (e.target === modalWrap) modalWrap.remove(); });

  modalWrap.querySelector('#share-card-btn')?.addEventListener('click', async () => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `carnet-hunter-${user.username}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Carnet Oficial WC Hunter · @${user.username}`,
          text: `¡Soy Nivel ${levelInfo.level} (${levelInfo.rank}) en WC Hunter! 🚽🔥`
        });
        return;
      }
    } catch (e) {}
    // Fallback: descarga directa
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `carnet-hunter-${user.username}.png`;
    a.click();
    store.showToast('📥 Carnet descargado para compartir', 'success');
  });
}
