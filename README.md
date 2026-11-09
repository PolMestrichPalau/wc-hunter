# 🚽 WC HUNTER

> **Tagline:** *No busques un WC. Busca un WC que quieras usar.*

**WC Hunter** es una Progressive Web App (PWA) colaborativa y gamificada para descubrir, valorar, verificar en tiempo real y coleccionar WC públicos o de acceso público.

---

## 🌟 Características Principales

* 🗺️ **Mapa Interactivo:** Marcadores semafóricos en tiempo real (🟢 Reciente y fiable, 🟡 Parcialmente verificado, 🔴 Problemas/Cerrado).
* 🚨 **Modo Emergencia ("NECESITO WC"):** Reordenación instantánea para priorizar baños abiertos, gratuitos, limpios y con papel a menos de 500m.
* 🧼 **WC Score (0-100) & Confidence Score (%):** Algoritmo matemático con decaimiento temporal y penalización ante reportes contradictorios.
* ⚡ **Verificación Rápida en 5 segundos:** "¿Hay papel?", "¿Hay jabón?", "¿Está limpio?" con recompensa de +15 XP inmediata.
* 🎮 **Gamificación Completa:**
  * Curva de XP y niveles de Hunter (Novato $\rightarrow$ 👑 Leyenda del Retrete).
  * 🗃️ **Mi Álbum de Tronos:** Colección de cromos por categorías (Transportes, Museos, Secretos, Hoteles).
  * 🎯 Misiones diarias y semanales.
  * 🏆 Rankings de mejores WC y Top Hunters de la comunidad.
  * 🏷️ Títulos honoríficos y apodos generados automáticamente.
* 🔐 **WCs Secretos & Clandestinos:** Baños exclusivos de alta dificultad con bonus especial de XP.

---

## 🛡️ Calidad y antifraude (v5.0)

* Todo texto introducido por usuarios se escapa antes de pintarse (`js/utils.js`), sin XSS.
* Verificación: 1 por WC cada 3 h. Descubrimientos: máx. 3/día con XP.
* Alta de WC con selector de ubicación en mapa, país real y autorrelleno de ciudad/dirección (OpenStreetMap Nominatim).
* Estado local versionado y con copia de seguridad (`wc_hunter_state_v2_backup`) si se corrompe.
* PWA con service worker *network-first* e iconos. (Tailwind/Leaflet vienen de CDN: sin conexión la interfaz puede verse sin estilos.)
* Pruebas: `powershell -ExecutionPolicy Bypass -File tests\verify.ps1` (requiere Node.js para las pruebas de lógica).

---

## 🚀 Despliegue y Ejecución Local

### Ejecutar Localmente
En PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Abre en tu navegador: `http://localhost:3000/`

---

## 📱 Despliegue Online
Esta aplicación es una PWA estática sin servidor backend pesado, lista para desplegarse gratis en:
* **Cloudflare Pages / Tunnels**
* **Vercel**
* **GitHub Pages**
