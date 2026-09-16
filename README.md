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
