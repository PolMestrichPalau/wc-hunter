/**
 * WC HUNTER — Vista Hunter / Gamificación Hub (Pestaña 4)
 */
import { store } from '../state.js';
import { ACHIEVEMENTS_CATALOG } from '../seedData.js';
import { calculateUserLevel } from '../algorithms.js';

let activeSection = 'missions'; // 'missions' | 'collection' | 'achievements'

export function renderHunterView(container) {
  const user = store.user;
  const levelInfo = calculateUserLevel(user.xp);
  const missions = store.missions;
  const collections = store.collections;
  const unlockedAchIds = user.unlocked_achievements;

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto pb-24">
      <!-- Cabecera de Gamificación: Nivel, Racha y XP -->
      <div class="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 px-4 pt-5 pb-4 border-b border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
              ${user.avatar}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h1 class="text-lg font-black text-white">${user.username}</h1>
                <span class="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  NV. ${levelInfo.level}
                </span>
              </div>
              <p class="text-xs font-black text-amber-400 mt-0.5">${user.title}</p>
            </div>
          </div>

          <!-- Racha Hunter -->
          <div class="flex flex-col items-center bg-slate-800/90 border border-orange-500/40 rounded-2xl px-3 py-2 shadow">
            <span class="text-xl animate-bounce">🔥</span>
            <span class="text-sm font-black text-orange-400 leading-none mt-1">${user.streak_days} DÍAS</span>
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">RACHA</span>
          </div>
        </div>

        <!-- Barra de Progreso de XP -->
        <div class="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div class="flex items-center justify-between text-xs font-bold mb-1.5">
            <span class="text-slate-300">Rango: <span class="text-amber-400 font-extrabold">${levelInfo.rankTitle}</span></span>
            <span class="text-amber-400 font-black">${user.xp.toLocaleString()} / ${levelInfo.nextLevelXP.toLocaleString()} XP</span>
          </div>
          <div class="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500" style="width: ${levelInfo.progressPercent}%"></div>
          </div>
          <div class="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-1">
            <span>Progreso del nivel</span>
            <span>${levelInfo.progressPercent}% completado</span>
          </div>
        </div>

        <!-- Sub-navegación: Misiones, Álbum y Logros -->
        <div class="flex p-1 bg-slate-800 rounded-xl border border-slate-700/60 mt-3">
          <button id="hunter-tab-missions" class="flex-1 py-2 text-xs font-black rounded-lg transition ${activeSection === 'missions' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'}">
            🎯 Misiones
          </button>
          <button id="hunter-tab-collection" class="flex-1 py-2 text-xs font-black rounded-lg transition ${activeSection === 'collection' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'}">
            🗃️ Álbum
          </button>
          <button id="hunter-tab-achievements" class="flex-1 py-2 text-xs font-black rounded-lg transition ${activeSection === 'achievements' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'}">
            🏆 Logros (${unlockedAchIds.length})
          </button>
        </div>
      </div>

      <!-- Contenido según subpestaña -->
      <div class="p-4 flex flex-col gap-3.5">
        ${activeSection === 'missions' ? `
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-black text-white uppercase tracking-wider">Misiones Activas</h2>
            <span class="text-xs text-slate-400">Reinicio en 14h</span>
          </div>

          ${missions.map(m => `
            <div class="bg-slate-800/90 border ${m.completed ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-700/70'} rounded-2xl p-3.5 shadow flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded ${m.badge === 'Semanal' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}">
                      ${m.badge}
                    </span>
                    ${m.completed ? `<span class="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">¡COMPLETADA!</span>` : ''}
                  </div>
                  <h3 class="text-sm font-black text-white">${m.title}</h3>
                  <p class="text-xs text-slate-400 mt-0.5">${m.description}</p>
                </div>
                <div class="flex flex-col items-end flex-shrink-0">
                  <span class="text-xs font-black text-amber-400">+${m.xp_reward} XP</span>
                  <span class="text-xs text-slate-300 font-extrabold mt-1">${m.progress}/${m.target}</span>
                </div>
              </div>

              <!-- Barra progreso misión -->
              <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div class="h-full ${m.completed ? 'bg-emerald-500' : 'bg-amber-500'} transition-all" style="width: ${(m.progress / m.target) * 100}%"></div>
              </div>
            </div>
          `).join('')}
        ` : activeSection === 'collection' ? `
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-black text-white uppercase tracking-wider">Mi Álbum de Tronos</h2>
            <span class="text-xs text-amber-400 font-bold">Coleccionismo</span>
          </div>

          ${collections.map(col => {
            const collectedCount = col.stickers.filter(s => s.collected).length;
            const total = col.stickers.length;
            const isCompleted = collectedCount === total;

            return `
              <div class="bg-slate-800/90 border ${isCompleted ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-700/80'} rounded-2xl p-4 shadow flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-base font-black text-white flex items-center gap-1.5">
                      <span>${col.title}</span>
                      ${isCompleted ? '👑' : ''}
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">${col.description}</p>
                  </div>
                  <span class="text-xs font-extrabold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                    ${collectedCount}/${total}
                  </span>
                </div>

                <!-- Parrilla de Cromos / Stickers -->
                <div class="grid grid-cols-2 gap-2.5 pt-1">
                  ${col.stickers.map(s => `
                    <div class="p-2.5 rounded-xl border ${s.collected ? 'bg-slate-700/80 border-amber-400/50 shadow' : 'bg-slate-900/60 border-slate-800 opacity-50'} flex items-center gap-2.5 transition">
                      <span class="text-2xl ${s.collected ? '' : 'filter grayscale blur-[1px]'}">${s.icon}</span>
                      <div class="min-w-0">
                        <h4 class="text-xs font-bold text-white truncate">${s.name}</h4>
                        <span class="text-[10px] font-semibold ${s.collected ? 'text-emerald-400' : 'text-slate-500'}">
                          ${s.collected ? '✓ Coleccionado' : '🔒 Bloqueado'}
                        </span>
                      </div>
                    </div>
                  `).join('')}
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
                  <span>Recompensa al completar:</span>
                  <span class="font-bold text-amber-300">${col.reward_title}</span>
                </div>
              </div>
            `;
          }).join('')}
        ` : `
          <!-- Logros -->
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm font-black text-white uppercase tracking-wider">Logros Hunter</h2>
            <span class="text-xs text-slate-400">${unlockedAchIds.length} de ${ACHIEVEMENTS_CATALOG.length}</span>
          </div>

          <div class="flex flex-col gap-2.5">
            ${ACHIEVEMENTS_CATALOG.map(ach => {
              const isUnlocked = unlockedAchIds.includes(ach.id);
              if (ach.hidden && !isUnlocked) {
                return `
                  <div class="bg-slate-800/50 border border-dashed border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3 opacity-60">
                    <span class="text-2xl">❓</span>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-xs font-black text-slate-400">Logro Oculto</h4>
                      <p class="text-[11px] text-slate-500 mt-0.5">Explora circunstancias extraordinarias para desbloquearlo.</p>
                    </div>
                    <span class="text-xs font-bold text-slate-500">+${ach.xp} XP</span>
                  </div>
                `;
              }

              return `
                <div class="bg-slate-800/90 border ${isUnlocked ? 'border-amber-500/50' : 'border-slate-700/60 opacity-70'} rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 border ${isUnlocked ? 'border-amber-500' : 'border-slate-700'} flex items-center justify-center text-xl flex-shrink-0">
                      ${ach.icon}
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <h4 class="text-xs font-black ${isUnlocked ? 'text-white' : 'text-slate-300'} truncate">${ach.name}</h4>
                        <span class="rarity-badge ${ach.rarity}">${ach.rarity}</span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-0.5">${ach.description}</p>
                    </div>
                  </div>
                  <div class="flex flex-col items-end flex-shrink-0">
                    <span class="text-xs font-black ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}">
                      ${isUnlocked ? '✓ CONSEGUIDO' : `+${ach.xp} XP`}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  // Attach event listeners
  const missionsBtn = container.querySelector('#hunter-tab-missions');
  const collectionBtn = container.querySelector('#hunter-tab-collection');
  const achievementsBtn = container.querySelector('#hunter-tab-achievements');

  if (missionsBtn) {
    missionsBtn.addEventListener('click', () => {
      activeSection = 'missions';
      renderHunterView(container);
    });
  }

  if (collectionBtn) {
    collectionBtn.addEventListener('click', () => {
      activeSection = 'collection';
      renderHunterView(container);
    });
  }

  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', () => {
      activeSection = 'achievements';
      renderHunterView(container);
    });
  }
}
