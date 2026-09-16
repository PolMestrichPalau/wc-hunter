/**
 * WC HUNTER — Modal de Añadir Nuevo WC (Descubrimiento)
 */
import { store } from '../state.js';

export function renderAddWcModal(container) {
  if (!store.isAddModalOpen) {
    container.innerHTML = '';
    return;
  }

  const uLoc = store.userLocation;

  container.innerHTML = `
    <div class="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <!-- Cabecera -->
        <div class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 class="text-base font-black text-white flex items-center gap-2">
              <span>➕</span> <span>Descubrir Nuevo WC</span>
            </h2>
            <p class="text-xs text-amber-400 font-bold">+100 XP por descubrimiento</p>
          </div>
          <button id="close-add-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition">
            ✕
          </button>
        </div>

        <!-- Formulario Scrollable -->
        <form id="add-wc-form" class="overflow-y-auto p-5 flex flex-col gap-4 text-slate-100">
          
          <!-- Nombre del WC -->
          <div>
            <label class="block text-xs font-black uppercase text-slate-300 mb-1">Nombre o Lugar *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ej. WC Cafetería Central (Planta 1)"
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- Ciudad y Dirección -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black uppercase text-slate-300 mb-1">Ciudad *</label>
              <input
                type="text"
                name="city"
                required
                value="${uLoc.name?.split(' ')[0] || 'Madrid'}"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-black uppercase text-slate-300 mb-1">Dirección / Calle</label>
              <input
                type="text"
                name="address"
                placeholder="Calle o zona"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Tipo de Establecimiento -->
          <div>
            <label class="block text-xs font-black uppercase text-slate-300 mb-1">Categoría del Lugar</label>
            <select name="type" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500">
              <option value="public_street">🚻 WC Público de Calle</option>
              <option value="public_park">🌳 Parque Público</option>
              <option value="shopping_mall">🛍️ Centro Comercial</option>
              <option value="museum">🏛️ Museo / Centro Cultural</option>
              <option value="train">🚆 Estación de Tren / Metro</option>
              <option value="restaurant">🍔 Restaurante</option>
              <option value="cafe">☕ Cafetería</option>
              <option value="luxury_hotel">🏨 Hotel</option>
              <option value="gas_station">⛽ Gasolinera</option>
              <option value="beach">🏖️ Playa</option>
              <option value="university_top">🎓 Universidad</option>
              <option value="airplane">✈️ Avión</option>
              <option value="other">🏠 Otro</option>
            </select>
          </div>

          <!-- Acceso y Precio -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black uppercase text-slate-300 mb-1">Tipo de Acceso</label>
              <select name="access_type" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500">
                <option value="free">🆓 Gratuito / Libre</option>
                <option value="customers_only">🍔 Solo Clientes</option>
                <option value="paid">💰 De Pago</option>
                <option value="key_required">🔑 Pedir Llave</option>
                <option value="code_required">🔢 Código en Ticket</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-black uppercase text-slate-300 mb-1">Precio (€)</label>
              <input
                type="number"
                step="0.10"
                min="0"
                name="price"
                value="0"
                placeholder="0.00"
                class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <!-- Toggle: WC Secreto -->
          <div class="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">🔐</span>
              <div>
                <h4 class="text-xs font-black text-purple-300 uppercase">¿Es un WC Secreto?</h4>
                <p class="text-[11px] text-slate-400">Oculto, poco conocido o de acceso especial (+150 XP bonus)</p>
              </div>
            </div>
            <input type="checkbox" name="is_secret" class="w-5 h-5 accent-purple-500 rounded cursor-pointer" />
          </div>

          <!-- Equipamiento -->
          <div>
            <label class="block text-xs font-black uppercase text-slate-300 mb-2">Equipamiento Confirmado</label>
            <div class="grid grid-cols-2 gap-2 text-xs font-bold text-slate-200">
              <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
                <input type="checkbox" name="paper" checked class="accent-amber-500" />
                <span>🧻 Hay Papel</span>
              </label>
              <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
                <input type="checkbox" name="soap" checked class="accent-amber-500" />
                <span>🧴 Hay Jabón</span>
              </label>
              <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
                <input type="checkbox" name="baby_changing" class="accent-amber-500" />
                <span>👶 Cambiador</span>
              </label>
              <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
                <input type="checkbox" name="wheelchair" class="accent-amber-500" />
                <span>♿ Accesible</span>
              </label>
            </div>
          </div>

          <!-- Tu primera valoración -->
          <div>
            <label class="block text-xs font-black uppercase text-slate-300 mb-1">Puntuación Inicial (1 - 5 ⭐)</label>
            <div class="flex items-center gap-2">
              <select name="initial_rating" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-400 focus:outline-none">
                <option value="5">⭐⭐⭐⭐⭐ 5 Estrellas (Excepcional)</option>
                <option value="4" selected>⭐⭐⭐⭐ 4 Estrellas (Muy bueno)</option>
                <option value="3">⭐⭐⭐ 3 Estrellas (Aceptable)</option>
                <option value="2">⭐⭐ 2 Estrellas (Regular / Sucio)</option>
                <option value="1">⭐ 1 Estrella (Desastre)</option>
              </select>
            </div>
          </div>

          <!-- Comentario del Hunter -->
          <div>
            <label class="block text-xs font-black uppercase text-slate-300 mb-1">Consejo o Comentario del Hunter</label>
            <textarea
              name="comment"
              rows="2"
              placeholder="Ej. Entra por la puerta lateral y sube a la segunda planta, el pestillo cierra bien."
              class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 active:scale-95 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-xl transition mt-2 flex items-center justify-center gap-2"
          >
            <span>🏆</span> <span>Publicar Descubrimiento (+100 XP)</span>
          </button>
        </form>
      </div>
    </div>
  `;

  // Attach event listeners
  const closeBtn = container.querySelector('#close-add-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => store.closeAddModal());
  }

  const form = container.querySelector('#add-wc-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);

      // Desplazamiento sutil aleatorio para simular que está cerca de la posición del usuario
      const latOffset = (Math.random() - 0.5) * 0.006;
      const lngOffset = (Math.random() - 0.5) * 0.006;

      const accessType = fd.get('access_type');
      let accessLabel = '🆓 Gratuito';
      if (accessType === 'customers_only') accessLabel = '🍔 Solo clientes';
      else if (accessType === 'paid') accessLabel = `💰 ${fd.get('price')} €`;
      else if (accessType === 'key_required') accessLabel = '🔑 Pedir llave en mostrador';
      else if (accessType === 'code_required') accessLabel = '🔢 Código necesario';

      const data = {
        name: fd.get('name'),
        city: fd.get('city'),
        address: fd.get('address') || 'Cerca de tu ubicación',
        latitude: uLoc.lat + latOffset,
        longitude: uLoc.lng + lngOffset,
        type: fd.get('type'),
        access_type: accessType,
        access_label: accessLabel,
        price: parseFloat(fd.get('price')) || 0,
        is_secret: fd.get('is_secret') === 'on',
        paper: fd.get('paper') === 'on',
        soap: fd.get('soap') === 'on',
        baby_changing: fd.get('baby_changing') === 'on',
        wheelchair: fd.get('wheelchair') === 'on',
        initial_rating: parseInt(fd.get('initial_rating')) || 4,
        comment: fd.get('comment') || ''
      };

      store.addNewWC(data);
    });
  }
}
