/**
 * WC HUNTER — Vista Hunter Hub V2.0
 * Un juego real dentro de la app: Progreso, Próximos Logros, Álbum de Colección y Parrilla Coleccionable.
 */
import { store } from '../state.js';
import { calculateLevel } from '../engines/gameEngine.js';
import { ACHIEVEMENTS_CATALOG } from '../seedData.js';
import { computeCollections, computeUpcomingAchievements } from '../engines/userEngine.js';
import { esc } from '../utils.js';

export function renderHunterView(container) {
  const user = store.user;
  const levelInfo = calculateLevel(user.xp);
  const unlockedAchIds = user.unlocked_achievements || [];
  const collections = computeCollections(store.wcs, user);
  const collectedTotal = collections.reduce((s, c) => s + c.collected, 0);
  const catalogTotal = collections.reduce((s, c) => s + c.total, 0);
  const upcoming = computeUpcomingAchievements(user, 4);
  const missions = store.missions || [];

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      <!-- Cabecera de la Sección Hunter -->
      <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 pt-5 pb-4 border-b border-slate-800/80 shadow-md">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>💩</span>
              <span>HUNTER GAME HUB</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Explora, verifica y completa tu colección personal</p>
          </div>
          <span class="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl">
            Rango: ${levelInfo.rank}
          </span>
        </div>
      </div>

      <div class="px-4 sm:px-6 py-5 flex flex-col gap-5 max-w-4xl mx-auto w-full">
        
        <!-- 1. TU PROGRESO (Nivel + XP + Racha) -->
        <div class="bg-surface-container/95 border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-secondary/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                ${esc(user.avatar)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-black text-white">NIVEL ${levelInfo.level}</h2>
                  <span class="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                    ${esc(levelInfo.rank)}
                  </span>
                </div>
                <p class="text-xs font-bold text-slate-400 mt-0.5">${esc(user.title)}</p>
              </div>
            </div>

            <!-- Racha Hunter -->
            <div class="flex flex-col items-center bg-slate-950/80 border border-orange-500/40 rounded-2xl px-4 py-2 shadow">
              <span class="text-2xl animate-bounce">🔥</span>
              <span class="text-sm font-black text-orange-400 leading-none mt-1">${user.streak_days} DÍAS</span>
              <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">RACHA</span>
            </div>
          </div>

          <!-- Barra de Progreso XP -->
          <div class="mt-2">
            <div class="flex justify-between text-xs font-bold mb-1.5">
              <span class="text-slate-400">Progreso al siguiente nivel</span>
              <span class="text-emerald-400 font-black">${user.xp.toLocaleString()} / ${levelInfo.nextBase.toLocaleString()} XP</span>
            </div>
            <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500" style="width: ${levelInfo.percent}%"></div>
            </div>
          </div>
        </div>

        <!-- 2. 🏆 PRÓXIMOS LOGROS EN PROGRESO -->
        <div class="bg-surface-container/90 border border-white/10 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🏆</span>
              <span>Próximos Logros & Misiones</span>
            </h3>
            <span class="text-xs text-amber-400 font-bold">En curso</span>
          </div>

          <!-- Misiones activas (progreso real) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${missions.map(m => `
              <div class="bg-surface-container-high/70 border ${m.completed ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/5'} rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="text-xs font-black text-white truncate">🎯 ${esc(m.title)}</h4>
                  <span class="text-[10px] font-black ${m.completed ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0">
                    ${m.completed ? '✓ HECHA' : `+${esc(m.xp_reward)} XP`}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">${esc(m.description)}</p>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" style="width: ${Math.min(100, (m.progress / m.target) * 100)}%"></div>
                </div>
                <span class="text-[10px] font-bold text-slate-400">${esc(m.progress)} / ${esc(m.target)}</span>
              </div>
            `).join('')}
          </div>

          <!-- Próximos logros por desbloquear -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${upcoming.map(ach => `
              <div class="bg-surface-container-high/70 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-2xl">${esc(ach.icon)}</span>
                  <div class="min-w-0">
                    <h4 class="text-xs font-black text-white truncate">${esc(ach.name)}</h4>
                    <span class="text-[11px] font-bold text-slate-400">
                      Progreso: ${esc(ach.current)}/${esc(ach.target)}
                    </span>
                  </div>
                </div>
                <span class="text-xs text-slate-500 font-bold">⏳ +${esc(ach.xp)} XP</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. 🗃️ MI COLECCIÓN PERSONAL (progreso real) -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>🗃️</span>
                <span>Mi Álbum de Tronos</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Colecciona WCs únicos por todo el mundo</p>
            </div>
            <div class="text-right">
              <span class="text-base font-black text-amber-400 leading-none">${collectedTotal} / ${catalogTotal}</span>
              <span class="block text-[10px] text-slate-500 font-bold uppercase">TOTAL</span>
            </div>
          </div>

          <!-- Parrilla de Categorías de Colección -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
            ${collections.map(cat => `
              <div class="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xl">${esc(cat.icon)}</span>
                  <span class="text-xs font-black text-amber-400">${cat.collected}/${cat.total}</span>
                </div>
                <h4 class="text-xs font-black text-white truncate">${esc(cat.name)}</h4>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: ${cat.total ? (cat.collected / cat.total) * 100 : 0}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. PARRILLA DE LOGROS COLECCIONABLES CON CANDADOS -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3 shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🏅</span>
              <span>Todos los Logros (${unlockedAchIds.length} / ${ACHIEVEMENTS_CATALOG.length})</span>
            </h3>
            <span class="text-xs text-slate-500 font-semibold">Cromos</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${ACHIEVEMENTS_CATALOG.map(ach => {
              const isUnlocked = unlockedAchIds.includes(ach.id);
              if (!isUnlocked && ach.hidden) {
                return `
                  <div class="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-3 flex items-center gap-3 opacity-60">
                    <span class="text-2xl">🔒</span>
                    <div class="min-w-0">
                      <h4 class="text-xs font-black text-slate-400">???</h4>
                      <p class="text-[11px] text-slate-500 mt-0.5">Descubre cómo conseguirlo explorando.</p>
                    </div>
                  </div>
                `;
              }

              return `
                <div class="bg-slate-800/80 border ${isUnlocked ? 'border-amber-500/40' : 'border-slate-700/60 opacity-60'} rounded-2xl p-3 flex items-center justify-between gap-2 shadow-sm">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-2xl">${ach.icon}</span>
                    <div class="min-w-0">
                      <h4 class="text-xs font-black ${isUnlocked ? 'text-white' : 'text-slate-300'} truncate">${ach.name}</h4>
                      <p class="text-[10px] text-slate-400 truncate mt-0.5">${ach.description}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-black ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'} flex-shrink-0">
                    ${isUnlocked ? '✓ CONSEGUIDO' : `+${ach.xp} XP`}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

}
