/**
 * WC HUNTER — Modales de Compartir con QR y Feedback de Beta Testers V2.0
 */
import { store } from '../state.js';
import { esc } from '../utils.js';

const LIVE_URL = 'https://polmestrichpalau.github.io/wc-hunter/';

/**
 * Abre el modal con Código QR de alta resolución y enlace de invitación directa.
 */
export function openQrShareModal() {
  const existing = document.getElementById('qr-share-modal');
  if (existing) existing.remove();

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(LIVE_URL)}&bgcolor=0b1326&color=10b981&margin=14`;
  const shareText = '🚽 ¡Prueba WC Hunter! La app colaborativa para encontrar y cazar los mejores baños, limpios, gratis y con códigos de acceso en tiempo real:';

  const modal = document.createElement('div');
  modal.id = 'qr-share-modal';
  modal.className = 'fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-slide-up';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-4">
      
      <!-- Cabecera -->
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-2 text-left">
          <span class="text-2xl">📲</span>
          <div>
            <h3 class="text-base font-black text-white">Invitar a Probadores</h3>
            <p class="text-[11px] text-emerald-400 font-bold">Acceso directo sin descargas</p>
          </div>
        </div>
        <button id="close-qr-modal-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition">✕</button>
      </div>

      <!-- Imagen QR -->
      <div class="p-3 bg-surface-container rounded-3xl border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex flex-col items-center justify-center">
        <img
          src="${qrImageUrl}"
          alt="Código QR de WC Hunter"
          class="w-56 h-56 rounded-2xl object-contain bg-[#0b1326]"
          loading="eager"
        />
        <p class="text-[11px] text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
          <span>📷</span> <span>Apunta con la cámara de tu móvil</span>
        </p>
      </div>

      <!-- Cuadro de Enlace Limpio con botón Copiar -->
      <div class="w-full flex items-center gap-2 bg-slate-950/90 border border-white/10 rounded-2xl p-2.5">
        <input
          type="text"
          readonly
          value="${LIVE_URL}"
          class="w-full bg-transparent text-xs font-semibold text-slate-300 focus:outline-none select-all px-1 truncate"
        />
        <button id="copy-live-link-btn" class="bg-slate-800 hover:bg-slate-700 text-white font-black text-xs px-3 py-1.5 rounded-xl border border-white/10 flex-shrink-0 flex items-center gap-1 transition active:scale-95">
          <span>📋</span> <span>Copiar</span>
        </button>
      </div>

      <!-- Botones de Acción: WhatsApp y Descargar QR -->
      <div class="w-full grid grid-cols-2 gap-2.5">
        <a
          href="https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${LIVE_URL}`)}"
          target="_blank"
          rel="noopener"
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-3 rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <span>💬</span> <span>WhatsApp</span>
        </a>
        <a
          href="${qrImageUrl}"
          target="_blank"
          download="wc-hunter-qr.png"
          class="bg-slate-800 hover:bg-slate-700 border border-white/15 text-white font-black text-xs py-3 px-3 rounded-2xl shadow flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <span>⬇️</span> <span>Bajar QR</span>
        </a>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-qr-modal-btn')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#copy-live-link-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(LIVE_URL);
      store.showToast('📋 ¡Enlace copiado! Pégaselo a tus probadores.', 'success', 2500);
    } catch (e) {
      store.showToast(`🔗 ${LIVE_URL}`, 'info', 3500);
    }
  });
}

/**
 * Abre el modal interactivo de Feedback & Sugerencias de usuarios/testers (+20 XP).
 */
export function openFeedbackModal() {
  const existing = document.getElementById('feedback-tester-modal');
  if (existing) existing.remove();

  const user = store.user;

  const modal = document.createElement('div');
  modal.id = 'feedback-tester-modal';
  modal.className = 'fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700/80 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
      
      <!-- Cabecera -->
      <div class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 pt-5 pb-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 class="text-base font-black text-white flex items-center gap-2">
            <span>💬</span> <span>Buzón del Creador</span>
          </h3>
          <p class="text-xs text-amber-400 font-bold">+20 XP por aportar tu feedback de Beta Tester</p>
        </div>
        <button id="close-feedback-btn" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition">✕</button>
      </div>

      <!-- Formulario -->
      <form id="tester-feedback-form" class="overflow-y-auto p-6 flex flex-col gap-4 text-slate-100">
        
        <!-- Categoría de Feedback -->
        <div>
          <label class="block text-xs font-black uppercase text-slate-300 mb-1.5">¿Qué te gustaría compartir?</label>
          <div class="grid grid-cols-2 gap-2 text-xs font-bold">
            <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
              <input type="radio" name="feedback_type" value="💡 Idea o Sugerencia" checked class="accent-amber-500" />
              <span>💡 Sugerencia</span>
            </label>
            <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
              <input type="radio" name="feedback_type" value="🐞 Reportar un fallo" class="accent-rose-500" />
              <span>🐞 Reportar Fallo</span>
            </label>
            <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
              <input type="radio" name="feedback_type" value="🏙️ Nueva Ciudad o Zona" class="accent-cyan-500" />
              <span>🏙️ Nueva Zona</span>
            </label>
            <label class="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 cursor-pointer">
              <input type="radio" name="feedback_type" value="❤️ Me encanta la app" class="accent-emerald-500" />
              <span>❤️ Opinión / Ánimo</span>
            </label>
          </div>
        </div>

        <!-- Mensaje -->
        <div>
          <label class="block text-xs font-black uppercase text-slate-300 mb-1.5">Tu Mensaje o Sugerencia *</label>
          <textarea
            name="feedback_text"
            required
            rows="4"
            maxlength="600"
            placeholder="Cuéntanos con total confianza: ¿qué te gusta?, ¿qué echas en falta?, ¿qué no se entiende bien?..."
            class="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 leading-relaxed"
          ></textarea>
        </div>

        <!-- Contacto opcional -->
        <div>
          <label class="block text-xs font-black uppercase text-slate-300 mb-1">Tu contacto (Opcional por si te respondemos)</label>
          <input
            type="text"
            name="tester_contact"
            maxlength="80"
            placeholder="Email, Telegram o WhatsApp (opcional)"
            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <!-- Canales de Envío -->
        <div class="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            id="send-whatsapp-btn"
            class="tactile-btn w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <span>💬</span> <span>Enviar vía WhatsApp (+20 XP)</span>
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="send-email-btn"
              class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition"
            >
              <span>✉️</span> <span>Enviar Email</span>
            </button>
            <button
              type="button"
              id="copy-feedback-btn"
              class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition"
            >
              <span>📋</span> <span>Copiar Texto</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-feedback-btn')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const form = modal.querySelector('#tester-feedback-form');
  if (!form) return;

  const getPayload = () => {
    const fd = new FormData(form);
    const type = fd.get('feedback_type') || 'Sugerencia';
    const text = String(fd.get('feedback_text') || '').trim();
    const contact = String(fd.get('tester_contact') || '').trim();
    const formatted = `🚽 *Feedback WC Hunter*\n\n*Tipo:* ${type}\n*De:* @${user.username} (Nv. ${user.level})\n${contact ? `*Contacto:* ${contact}\n` : ''}\n*Mensaje:*\n${text}\n\n_Enviado desde WC Hunter v6.0_`;
    return { type, text, contact, formatted };
  };

  const markReward = () => {
    store.addXP(20, 'Feedback de Tester');
    modal.remove();
  };

  // Enviar por WhatsApp
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { text, formatted } = getPayload();
    if (!text || text.length < 4) {
      store.showToast('⚠️ Escribe al menos unas palabras de feedback.', 'info');
      return;
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formatted)}`;
    window.open(waUrl, '_blank');
    store.showToast('💬 ¡Gracias por tu feedback! Has ganado +20 XP', 'success');
    markReward();
  });

  // Enviar por Email
  modal.querySelector('#send-email-btn')?.addEventListener('click', () => {
    const { type, text, formatted } = getPayload();
    if (!text || text.length < 4) {
      store.showToast('⚠️ Escribe al menos unas palabras de feedback.', 'info');
      return;
    }
    const mailto = `mailto:?subject=${encodeURIComponent(`WC Hunter Feedback: ${type}`)}&body=${encodeURIComponent(formatted)}`;
    window.location.href = mailto;
    store.showToast('✉️ Abriendo tu cliente de email (+20 XP)', 'success');
    markReward();
  });

  // Copiar al portapapeles
  modal.querySelector('#copy-feedback-btn')?.addEventListener('click', async () => {
    const { text, formatted } = getPayload();
    if (!text || text.length < 4) {
      store.showToast('⚠️ Escribe al menos unas palabras de feedback.', 'info');
      return;
    }
    try {
      await navigator.clipboard.writeText(formatted);
      store.showToast('📋 Feedback copiado al portapapeles (+20 XP)', 'success');
      markReward();
    } catch (e) {
      store.showToast('No se pudo copiar el texto', 'info');
    }
  });
}
