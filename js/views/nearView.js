/**
 * WC HUNTER — Vista "🚨 NECESITO WC" V2.0
 * Herramienta funcional inmediata para emergencias y filtrado por necesidad directa.
 */
import { store } from '../state.js';
import { getSemanticStatus, formatRelativeTime, calculateDistanceMeters, formatWouldReturn } from '../engines/wcEngine.js';

export function renderNearView(container) {
  const uLoc = store.userLocation;
  const currentIntent = store.intentFilter || 'any';

  // Obtener WCs filtrados y calcular distancias
  const allWcs = store.wcs.map(wc => {
    const dist = calculateDistanceMeters(uLoc.lat, uLoc.lng, wc.latitude, wc.longitude);
    return { ...wc, distanceMeters: dist };
  });

  // Aplicar intención seleccionada
  let filtered = [...allWcs];
  if (currentIntent === 'clean') {
    filtered.sort((a, b) => (b.score_breakdown?.cleanliness || 0) - (a.score_breakdown?.cleanliness || 0));
  } else if (currentIntent === 'free') {
    filtered = filtered.filter(w => w.access_type === 'free' || w.price === 0);
    filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
  } else if (currentIntent === 'private') {
    filtered.sort((a, b) => (b.score_breakdown?.privacy || 0) - (a.score_breakdown?.privacy || 0));
  } else if (currentIntent === 'baby') {
    filtered = filtered.filter(w => w.equipment.baby_changing);
    filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
  } else if (currentIntent === 'accessible') {
    filtered = filtered.filter(w => w.equipment.wheelchair);
    filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
  } else if (currentIntent === 'equipped') {
    filtered = filtered.filter(w => w.equipment.paper && w.equipment.soap);
    filtered.sort((a, b) => b.score - a.score);
  } else {
    // 'any' / '🚨 CUALQUIERA' -> Prioridad: Abierto > Cercano > Score
    filtered.sort((a, b) => {
      if (a.current_status === 'closed' && b.current_status !== 'closed') return 1;
      if (a.current_status !== 'closed' && b.current_status === 'closed') return -1;
      return a.distanceMeters - b.distanceMeters;
    });
  }

  container.innerHTML = `
    <div class="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto pb-24 md:pb-8">
      
      <!-- Cabecera de Emergencia & Selector de Necesidad -->
      <div class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 pt-5 pb-4 border-b border-slate-800/80 shadow-md">
        
        <!-- Título -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span class="text-rose-500 animate-pulse">🚨</span> 
              <span>NECESITO UN WC</span>
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">
              Ubicación: <span class="text-amber-400 font-bold">${uLoc.name}</span> · Respuesta en 2 segundos
            </p>
          </div>
          <span class="text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl">
            Modo Rescate
          </span>
        </div>

        <!-- Pregunta: ¿Qué necesitas? -->
        <div class="mb-2">
          <span class="text-xs font-black uppercase text-slate-400 tracking-wider">¿Qué necesitas ahora mismo?</span>
        </div>

        <!-- Botones Grandes de Intención (Scroll horizontal suave o Grid en Desktop) -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button data-intent-val="any" class="big-intent-btn ${currentIntent === 'any' ? 'panic-active' : ''}">
            <span>🚨</span>
            <span>CUALQUIERA</span>
          </button>
          
          <button data-intent-val="clean" class="big-intent-btn ${currentIntent === 'clean' ? 'active' : ''}">
            <span>🧼</span>
            <span>LIMPIO</span>
          </button>

          <button data-intent-val="free" class="big-intent-btn ${currentIntent === 'free' ? 'active' : ''}">
            <span>🆓</span>
            <span>GRATIS</span>
          </button>

          <button data-intent-val="private" class="big-intent-btn ${currentIntent === 'private' ? 'active' : ''}">
            <span>🔒</span>
            <span>PRIVADO</span>
          </button>

          <button data-intent-val="equipped" class="big-intent-btn ${currentIntent === 'equipped' ? 'active' : ''}">
            <span>🧻</span>
            <span>BIEN EQUIPADO</span>
          </button>

          <button data-intent-val="baby" class="big-intent-btn ${currentIntent === 'baby' ? 'active' : ''}">
            <span>👶</span>
            <span>BEBÉ</span>
          </button>

          <button data-intent-val="accessible" class="big-intent-btn ${currentIntent === 'accessible' ? 'active' : ''}">
            <span>♿</span>
            <span>ACCESIBLE</span>
          </button>
        </div>
      </div>

      <!-- Sección de WC Recomendados Ahora -->
      <div class="px-4 sm:px-6 py-4 flex flex-col gap-3 max-w-4xl mx-auto w-full">
        
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-xs font-black uppercase tracking-wider text-slate-400">
            WC Recomendados Ahora (${filtered.length})
          </h2>
          <span class="text-xs text-slate-500 font-semibold">Ordenados por idoneidad</span>
        </div>

        ${filtered.length === 0 ? `
          <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center mt-4">
            <span class="text-4xl">🚽❓</span>
            <h3 class="text-base font-bold text-white mt-2">No hay WC con este filtro específico cerca</h3>
            <p class="text-xs text-slate-400 mt-1">Prueba a seleccionar "🚨 CUALQUIERA" para ver todas las opciones.</p>
          </div>
        ` : filtered.map(wc => {
          const semantic = getSemanticStatus(wc);
          const wouldRet = formatWouldReturn(wc.would_return_ratio);
          const distStr = wc.distanceMeters < 1000 ? `${wc.distanceMeters} m` : `${(wc.distanceMeters / 1000).toFixed(1)} km`;
          const walkMin = Math.max(1, Math.round(wc.distanceMeters / 80));

          return `
            <div class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition flex flex-col gap-2.5 cursor-pointer wc-rescue-card" data-wc-id="${wc.id}">
              
              <!-- Línea 1: Nombre + Distancia + WC Score -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-black text-white truncate">${wc.name}</span>
                    ${wc.is_secret ? `<span class="text-[10px] font-black bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">🔐 SECRETO</span>` : ''}
                  </div>
                  <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <span class="text-amber-400 font-bold">${distStr} (~${walkMin} min a pie)</span>
                    <span>·</span>
                    <span class="truncate">${wc.address}</span>
                  </div>
                </div>

                <!-- Score Dial Compacto -->
                <div class="flex flex-col items-end flex-shrink-0">
                  <div class="text-lg font-black ${wc.score >= 85 ? 'text-emerald-400' : (wc.score >= 70 ? 'text-amber-400' : 'text-rose-400')} leading-none">
                    ${wc.score}<span class="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-bold mt-1">⭐ ${(wc.score / 20).toFixed(1)}</span>
                </div>
              </div>

              <!-- Línea 2: Estado + Acceso + Equipamiento Clave -->
              <div class="flex items-center justify-between gap-2 flex-wrap text-xs pt-1 border-t border-slate-800/80">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-black ${semantic.color === 'green' ? 'text-emerald-400' : (semantic.color === 'red' ? 'text-rose-400' : 'text-amber-400')}">
                    ${semantic.label}
                  </span>
                  <span>·</span>
                  <span class="font-bold text-slate-300">
                    ${wc.access_type === 'free' ? '🆓 Gratis' : (wc.access_type === 'customers_only' ? '🍔 Solo clientes' : `💰 ${wc.price?.toFixed(2) || '0.50'} €`)}
                  </span>
                  <span>·</span>
                  <span class="font-bold text-slate-300">
                    🧻 ${wc.equipment.paper ? '✓' : '✗'} · 🧴 ${wc.equipment.soap ? '✓' : '✗'}
                  </span>
                </div>

                <!-- Fiabilidad + Última Verificación -->
                <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <span>🛡️ ${wc.confidence}% fiable</span>
                  <span>·</span>
                  <span>${formatRelativeTime(wc.last_verified_at)}</span>
                </div>
              </div>

              <!-- Línea 3: Métrica Volvería -->
              <div class="flex items-center justify-between text-[11px] bg-slate-950/60 rounded-xl px-3 py-1.5 border border-slate-800/50">
                <span class="text-emerald-400 font-black">👍 ${wouldRet.sentence}</span>
                <span class="text-slate-400 font-bold">Ver detalles →</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach event listeners
  const intentBtns = container.querySelectorAll('[data-intent-val]');
  intentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-intent-val');
      store.setIntentFilter(val === 'any' ? null : val);
      renderNearView(container);
    });
  });

  const cards = container.querySelectorAll('.wc-rescue-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const wcId = card.getAttribute('data-wc-id');
      store.openWcDetail(wcId);
    });
  });
}
