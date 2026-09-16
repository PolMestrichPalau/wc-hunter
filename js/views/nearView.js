/**
 * WC HUNTER — Vista "Cerca" & Feed de Emergencia (Pestaña 2)
 */
import { store } from '../state.js';
import { getStatusSemantic, formatRelativeTime } from '../algorithms.js';

// Distancia euclidiana aproximada en metros (fórmula Haversine simplificada)
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function renderNearView(container) {
  const wcs = store.getFilteredWCs();
  const uLoc = store.userLocation;
  const isEmergency = store.emergencyMode;

  // Añadir distancia calculada a cada WC
  const wcsWithDist = wcs.map(wc => {
    const dist = calculateDistanceMeters(uLoc.lat, uLoc.lng, wc.latitude, wc.longitude);
    return { ...wc, distanceMeters: dist };
  });

  // Si no está en emergencia estricta, ordenar por distancia
  if (!isEmergency) {
    wcsWithDist.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto pb-24">
      <!-- Cabecera -->
      <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-slate-800">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h1 class="text-xl font-black text-white flex items-center gap-2">
              <span>📍</span> <span>WC Cerca de Ti</span>
            </h1>
            <p class="text-xs text-slate-400">
              Ubicación: <span class="text-amber-400 font-semibold">${uLoc.name || 'Madrid Centro'}</span> · ${wcs.length} encontrados
            </p>
          </div>
          <button
            id="near-emergency-toggle"
            class="${isEmergency ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-rose-400 border border-rose-500/40'} text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🚨</span>
            <span>${isEmergency ? 'EMERGENCIA ON' : 'PÁNICO'}</span>
          </button>
        </div>

        ${isEmergency ? `
          <div class="bg-rose-500/15 border border-rose-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-rose-300">
            <span class="flex items-center gap-1.5 font-bold">
              <span>⚡</span> <span>Modo Emergencia: Priorizando WC Abiertos, Gratis y con Papel</span>
            </span>
            <button id="disable-emergency-btn" class="underline font-bold text-white hover:text-rose-200">Desactivar</button>
          </div>
        ` : `
          <!-- Filtros de Intención Rápida -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button data-intent="clean" class="intent-pill ${store.intentFilter === 'clean' ? 'active' : ''}">🧼 Limpio</button>
            <button data-intent="free" class="intent-pill ${store.intentFilter === 'free' ? 'active' : ''}">🆓 Gratis</button>
            <button data-intent="private" class="intent-pill ${store.intentFilter === 'private' ? 'active' : ''}">🔒 Privado</button>
            <button data-intent="secret" class="intent-pill ${store.intentFilter === 'secret' ? 'active' : ''}">🔐 Secretos</button>
            <button data-intent="accessible" class="intent-pill ${store.intentFilter === 'accessible' ? 'active' : ''}">♿ Accesible</button>
          </div>
        `}
      </div>

      <!-- Feed de WCs -->
      <div class="p-4 flex flex-col gap-3.5">
        ${wcsWithDist.length === 0 ? `
          <div class="bg-slate-800/60 rounded-2xl p-8 text-center border border-slate-700/50 mt-4">
            <span class="text-4xl">🚽❓</span>
            <h3 class="text-base font-bold text-white mt-2">No se encontraron WC con estos filtros</h3>
            <p class="text-xs text-slate-400 mt-1">Prueba a desactivar filtros o sé el primer Hunter en añadir uno.</p>
            <button id="empty-add-btn" class="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition">
              ➕ Añadir Nuevo WC
            </button>
          </div>
        ` : wcsWithDist.map((wc, idx) => {
          const semantic = getStatusSemantic(wc);
          const distStr = wc.distanceMeters < 1000 ? `${wc.distanceMeters} m` : `${(wc.distanceMeters / 1000).toFixed(1)} km`;
          const walkMin = Math.max(1, Math.round(wc.distanceMeters / 80)); // 80 m/min a pie
          
          return `
            <div class="wc-card bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-3.5 shadow-md flex flex-col gap-3 transition" data-wc-id="${wc.id}">
              <!-- Cabecera de la Tarjeta -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap mb-1">
                    <span class="rarity-badge ${wc.rarity}">${wc.rarity}</span>
                    ${wc.is_secret ? `<span class="bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-black px-1.5 py-0.5 rounded-md">🔐 SECRETO</span>` : ''}
                    <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <span>🚶</span> <span>${distStr} (~${walkMin} min)</span>
                    </span>
                  </div>
                  <h2 class="text-base font-black text-white truncate hover:text-amber-400 cursor-pointer wc-title-click" data-wc-id="${wc.id}">
                    ${wc.name}
                  </h2>
                  <p class="text-xs text-slate-400 truncate mt-0.5">${wc.address}, ${wc.city}</p>
                </div>

                <!-- Círculo de WC Score -->
                <div class="flex flex-col items-end flex-shrink-0">
                  <div class="w-12 h-12 rounded-xl bg-slate-900 border-2 ${wc.score >= 85 ? 'border-emerald-500 text-emerald-400' : (wc.score >= 70 ? 'border-amber-500 text-amber-400' : 'border-rose-500 text-rose-400')} flex flex-col items-center justify-center font-black shadow-inner">
                    <span class="text-base leading-none">${wc.score}</span>
                    <span class="text-[9px] text-slate-400 font-bold uppercase">SCORE</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-semibold mt-1">🛡️ ${wc.confidence}% conf.</span>
                </div>
              </div>

              <!-- Banner de Acceso y Estado -->
              <div class="flex items-center justify-between gap-2 bg-slate-900/60 rounded-xl p-2 border border-slate-700/50 text-xs">
                <div class="flex items-center gap-2 truncate">
                  <span class="font-bold text-amber-300 truncate">${wc.access_label}</span>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span class="w-2 h-2 rounded-full ${semantic.dotClass}"></span>
                  <span class="text-[11px] font-semibold text-slate-300">${formatRelativeTime(wc.last_verified_at)}</span>
                </div>
              </div>

              <!-- Equipamiento Tags -->
              <div class="flex items-center gap-2 text-xs flex-wrap">
                <span class="tag-pill ${wc.equipment.paper ? 'tag-pill-active' : 'tag-pill-inactive'}">
                  🧻 Papel ${wc.equipment.paper ? '✓' : '✗'}
                </span>
                <span class="tag-pill ${wc.equipment.soap ? 'tag-pill-active' : 'tag-pill-inactive'}">
                  🧴 Jabón ${wc.equipment.soap ? '✓' : '✗'}
                </span>
                ${wc.equipment.baby_changing ? `<span class="tag-pill tag-pill-active">👶 Cambiador</span>` : ''}
                ${wc.equipment.wheelchair ? `<span class="tag-pill tag-pill-active">♿ Accesible</span>` : ''}
                ${wc.personality_tag ? `<span class="tag-pill bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold">${wc.personality_tag}</span>` : ''}
              </div>

              <!-- Botones de Acción -->
              <div class="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                <button
                  class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 wc-detail-btn"
                  data-wc-id="${wc.id}"
                >
                  <span>📋</span> <span>Ver Ficha Completa</span>
                </button>
                <button
                  class="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 quick-verify-btn"
                  data-wc-id="${wc.id}"
                >
                  <span>⚡</span> <span>Verificar Ahora</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach event listeners
  const emergToggle = container.querySelector('#near-emergency-toggle');
  if (emergToggle) {
    emergToggle.addEventListener('click', () => store.toggleEmergencyMode());
  }

  const disableEmergBtn = container.querySelector('#disable-emergency-btn');
  if (disableEmergBtn) {
    disableEmergBtn.addEventListener('click', () => store.toggleEmergencyMode());
  }

  const emptyAddBtn = container.querySelector('#empty-add-btn');
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener('click', () => store.openAddModal());
  }

  const intentButtons = container.querySelectorAll('[data-intent]');
  intentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const intent = btn.getAttribute('data-intent');
      store.setIntentFilter(intent);
      renderNearView(container);
    });
  });

  const detailButtons = container.querySelectorAll('.wc-detail-btn, .wc-title-click');
  detailButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const wcId = btn.getAttribute('data-wc-id');
      store.openWcDetail(wcId);
    });
  });

  const quickVerifyBtns = container.querySelectorAll('.quick-verify-btn');
  quickVerifyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const wcId = btn.getAttribute('data-wc-id');
      store.openWcDetail(wcId);
      // Ficha abierta, se scrollará automáticamente al widget de verificación
    });
  });
}
