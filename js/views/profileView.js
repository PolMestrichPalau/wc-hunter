/**
 * WC HUNTER — Vista Perfil del Usuario (Pestaña 5)
 */
import { store } from '../state.js';
import { calculateUserLevel } from '../algorithms.js';

export function renderProfileView(container) {
  const user = store.user;
  const levelInfo = calculateUserLevel(user.xp);

  // Generador de apodo dinámico
  const autoNick = `El ${user.title.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '').trim()} de los ${user.stats.visited_count} Retretes`;

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto pb-24">
      <!-- Tarjeta Principal del Perfil -->
      <div class="bg-gradient-to-b from-slate-800 to-slate-900 p-5 border-b border-slate-800 flex flex-col items-center text-center">
        <div class="relative mb-3">
          <div class="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
            ${user.avatar}
          </div>
          <span class="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border-2 border-slate-900">
            Nv. ${levelInfo.level}
          </span>
        </div>

        <h1 class="text-xl font-black text-white">${user.username}</h1>
        <p class="text-xs text-amber-400 font-extrabold mt-0.5 tracking-wide">${user.title}</p>
        <span class="text-[11px] text-slate-400 italic mt-1">"${autoNick}"</span>

        <!-- Badge de Reputación -->
        <div class="mt-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <span class="text-sm">🛡️</span>
          <span class="text-xs font-bold text-emerald-300">Reputación Hunter: <strong>${user.reputation}% Fiable</strong></span>
        </div>
      </div>

      <!-- Selector de Título Honorífico -->
      <div class="p-4 flex flex-col gap-4">
        <div class="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-4 shadow">
          <h2 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>🏷️</span> <span>Elegir Título Visible</span>
          </h2>
          <select id="user-title-select" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500">
            ${user.unlocked_titles.map(t => `
              <option value="${t}" ${t === user.title ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>
          <p class="text-[11px] text-slate-400 mt-2">
            Desbloquea más títulos subiendo de nivel y completando colecciones especiales.
          </p>
        </div>

        <!-- Estadísticas Detalladas de Contribución -->
        <div class="bg-slate-800/90 border border-slate-700/70 rounded-2xl p-4 shadow">
          <h2 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>📊</span> <span>Estadísticas de Exploración</span>
          </h2>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">WC Visitados</span>
              <span class="text-lg font-black text-white mt-0.5">${user.stats.visited_count}</span>
            </div>
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">WC Descubiertos</span>
              <span class="text-lg font-black text-amber-400 mt-0.5">${user.stats.discovered_count}</span>
            </div>
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">Verificaciones</span>
              <span class="text-lg font-black text-emerald-400 mt-0.5">${user.stats.verifications_count}</span>
            </div>
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">Fotos Subidas</span>
              <span class="text-lg font-black text-blue-400 mt-0.5">${user.stats.photos_count}</span>
            </div>
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">Ciudades</span>
              <span class="text-lg font-black text-purple-400 mt-0.5">${user.stats.cities_count}</span>
            </div>
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
              <span class="text-[11px] font-bold text-slate-400">WC Secretos</span>
              <span class="text-lg font-black text-rose-400 mt-0.5">${user.stats.secrets_found}</span>
            </div>
          </div>
        </div>

        <!-- Opciones de Desarrollo / Reset -->
        <div class="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow flex flex-col gap-2">
          <h3 class="text-xs font-black text-slate-400 uppercase tracking-wider">Gestión de Datos Locales</h3>
          <p class="text-[11px] text-slate-400">Los datos se guardan de forma local en tu navegador (Local-First).</p>
          <button id="reset-app-data-btn" class="bg-slate-700 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-bold text-xs py-2.5 px-3 rounded-xl transition border border-slate-600">
            🔄 Restablecer Datos Iniciales de Prueba
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  const titleSelect = container.querySelector('#user-title-select');
  if (titleSelect) {
    titleSelect.addEventListener('change', (e) => {
      user.title = e.target.value;
      store.saveState();
      store.showToast(`🏷️ Título cambiado a: ${user.title}`, 'info');
      renderProfileView(container);
    });
  }

  const resetBtn = container.querySelector('#reset-app-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Deseas restaurar la base de datos y usuario de prueba a los valores iniciales?')) {
        store.resetToDefaults();
        store.showToast('✅ Datos reiniciados con éxito', 'success');
        renderProfileView(container);
      }
    });
  }
}
