/**
 * WC HUNTER — Vista Perfil & Récords Personales V2.0
 */
import { store } from '../state.js';
import { AVATAR_POOL } from '../seedData.js';
import { calculateLevel } from '../engines/gameEngine.js';
import { computeUserRecords, generateUserNickname } from '../engines/userEngine.js';
import { esc } from '../utils.js';
import { backend, describeError } from '../backend.js';

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
