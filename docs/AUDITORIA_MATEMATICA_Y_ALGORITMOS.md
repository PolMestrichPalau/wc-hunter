# WC HUNTER — ESPECIFICACIÓN MATEMÁTICA Y AUDITORÍA DE ALGORITMOS
*Documento técnico preparado para auditoría algorítmica profunda mediante Claude (Local / Claude Code / Claude Desktop)*

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

El núcleo matemático y algorítmico de **WC Hunter** está distribuido en 4 motores modulares y libres de dependencias externas:
1. `js/engines/wcEngine.js`: Puntuación de calidad ponderada, decaimiento temporal bayesiano, fiabilidad y distancias geodésicas.
2. `js/engines/gameEngine.js`: Curvas de progresión exponencial de experiencia (XP), niveles, rangos y evaluación de rareza.
3. `js/algorithms.js`: Mapeo de dificultad multidimensional y tabla de recompensas de acción.
4. `js/state.js`: Control de estado antifraude, ventanas móviles temporales y coherencia transaccional local-first.

---

## 2. FORMULACIÓN MATEMÁTICA DETALLADA

### 2.1. Puntuación de Calidad Ponderada (WC Score Base)
El estado instantáneo de un baño se evalúa mediante un vector de 7 dimensiones normalizadas en el rango $[0, 100]$:
$$\vec{x} = (x_{\text{clean}}, x_{\text{paper}}, x_{\text{soap}}, x_{\text{odor}}, x_{\text{priv}}, x_{\text{cond}}, x_{\text{price}})^T$$

El vector de pesos $\vec{w}$ satisface la condición de normalización estricta $\sum_{i=1}^7 w_i = 1.0$:
$$\vec{w} = (0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.10)^T$$

La puntuación base instantánea se calcula como el producto escalar:
$$\text{Score}_{\text{base}} = \text{round}(\vec{w} \cdot \vec{x}) = \text{round}\left( \sum_{i=1}^7 w_i x_i \right)$$

---

### 2.2. Agregación Bayesiana con Decaimiento Temporal Reciente (Multi-Review)
Cuando existen $M$ reseñas históricas $\{ (S_j, t_j, R_j) \}_{j=1}^M$, donde:
- $S_j \in [0, 100]$ es la puntuación de la reseña $j$.
- $\Delta t_j = \frac{t_{\text{now}} - t_j}{86400 \times 1000}$ es la antigüedad en días solares.
- $R_j = \frac{\text{reputation}_j}{100} \in [0.1, 1.0]$ es el factor de reputación del cazador.

El peso de cada reporte se rige por un **decaimiento exponencial continuo** con constante de desintegración $\lambda = 0.05\text{ días}^{-1}$:
$$\tau_{1/2} = \frac{\ln(2)}{0.05} \approx 13.86\text{ días}$$
$$W_j = R_j \cdot \exp(-0.05 \cdot \max(0, \Delta t_j))$$

La puntuación consolidada final se calcula mediante la media ponderada acotada:
$$\text{Score}_{\text{final}} = \min\left(100, \max\left(0, \text{round}\left( \frac{\sum_{j=1}^M W_j S_j}{\sum_{j=1}^M W_j} \right)\right)\right)$$

---

### 2.3. Índice de Confianza y Fiabilidad (Confidence Score)
El índice de fiabilidad refleja la certeza epistémica sobre el estado real del baño:
$$\text{Confidence} = \text{clamp}\left(5, 100, \text{round}( (B + U + P) \cdot D(t) - C ) \right)$$

Donde:
1. **Puntuación Base por Volumen ($B$):**
   $$B(N) = \begin{cases} 95 & \text{si } N \ge 10 \\ 85 & \text{si } 4 \le N < 10 \\ 65 & \text{si } 2 \le N < 4 \\ 40 & \text{si } N < 2 \end{cases}$$
   Donde $N = \max(\text{histórico}, \text{reportes recientes})$.

2. **Bono de Diversidad de Usuarios ($U$):**
   Para $K$ usuarios únicos que han verificado el WC:
   $$U = \min(20, K \times 5)$$

3. **Bono por Evidencia Fotográfica ($P$):**
   Con $\Delta t_{\text{foto}}$ en días desde la foto más reciente:
   $$P = \begin{cases} 15 & \text{si } \Delta t_{\text{foto}} \le 7\text{ días} \\ 5 & \text{si } 7 < \Delta t_{\text{foto}} \le 30\text{ días} \\ 0 & \text{si } \Delta t_{\text{foto}} > 30\text{ días} \end{cases}$$

4. **Factor de Decaimiento Temporal por Horas ($D(t)$):**
   Con $\Delta h = \frac{t_{\text{now}} - t_{\text{última}}}{3600 \times 1000}$ horas:
   $$D(\Delta h) = \begin{cases} 1.00 & \text{si } \Delta h \le 2\text{ h} \\ 0.90 & \text{si } 2 < \Delta h \le 24\text{ h} \\ 0.70 & \text{si } 24 < \Delta h \le 168\text{ h (7 d)} \\ 0.45 & \text{si } 168 < \Delta h \le 720\text{ h (30 d)} \\ 0.20 & \text{si } \Delta h > 720\text{ h} \end{cases}$$

5. **Penalización por Contradicción Reciente ($C$):**
   Si en los últimos 3 reportes coexisten reportes afirmativos y negativos de suministros esenciales ($\text{has\_paper} = \text{true} \land \text{false}$):
   $$C = 35$$

---

### 2.4. Progresión Gamificada: Curva de Experiencia y Nivel
La relación entre el nivel del jugador $L \in [1, \infty)$ y el XP acumulado sigue una ley de potencia asimétrica:
$$\text{XP}_{\text{base}}(L) = \lfloor 100 \cdot (L - 1)^{1.6} \rfloor$$

Para calcular el nivel a partir de un XP acumulado arbitrario:
$$L(\text{XP}) = \max\left(1, \left\lfloor \left( \frac{\max(0, \text{XP})}{100} \right)^{\frac{1}{1.6}} \right\rfloor + 1\right)$$

El coste marginal en XP para subir del nivel $L$ al nivel $L+1$ es:
$$\Delta\text{XP}(L) = \lfloor 100 \cdot L^{1.6} \rfloor - \lfloor 100 \cdot (L - 1)^{1.6} \rfloor$$

Aproximación por derivada:
$$\frac{d\text{XP}}{dL} \approx 160 \cdot (L - 1)^{0.6}$$

El porcentaje relativo hacia el siguiente nivel:
$$\text{Progreso}\% = \min\left(100, \max\left(0, \text{round}\left( \frac{\text{XP} - \text{XP}_{\text{base}}(L)}{\text{XP}_{\text{base}}(L+1) - \text{XP}_{\text{base}}(L)} \times 100 \right)\right)\right)$$

---

### 2.5. Cálculo Geodésico y Cinemática Peatonal
La distancia métrica entre la coordenada del usuario $(\phi_1, \lambda_1)$ y el WC $(\phi_2, \lambda_2)$ se calcula mediante la fórmula de Haversine sobre una esfera de radio medio terrestre $R = 6.371 \times 10^6\text{ m}$:

$$\Delta\phi = \frac{(\phi_2 - \phi_1)\pi}{180}, \quad \Delta\lambda = \frac{(\lambda_2 - \lambda_1)\pi}{180}$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\phi_1 \pi}{180}\right) \cos\left(\frac{\phi_2 \pi}{180}\right) \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

El tiempo de marcha estimado se modela con velocidad media peatonal urbana $v_{\text{walk}} = 1.33\text{ m/s} \approx 4.8\text{ km/h}$:
$$t_{\text{walk}} = \text{round}\left(\frac{d}{80}\right)\text{ minutos}$$

---

### 2.6. Antifraude y Equilibrio Económico
1. **Cooldown de Verificación por WC:**
   $$t_{\text{now}} - t_{\text{last\_verified\_by\_user}}(wc\_id) \ge 10.800.000\text{ ms (3 horas)}$$
2. **Límite Diario de Descubrimientos con XP:**
   En una ventana rodante de 24 horas:
   $$|\{ t \in \text{discovery\_log} \mid t_{\text{now}} - t < 86.400.000\text{ ms} \}| \le 3$$
3. **Restricción de Rareza Autoasignada:**
   Un usuario solo puede crear baños hasta rareza `LEGENDARY`. La categoría `MYTHIC` (500 XP) está reservada estrictamente a auditoría del sistema o datos curados.

---

## 3. CHECKLIST PARA LA AUDITORÍA CON CLAUDE

Cuando le pidas a Claude que analice este documento y el código, pídele que responda a los siguientes puntos críticos:
1. **Estabilidad y Sensibilidad:** ¿Existe riesgo de división por cero o flotantes NaN en `calculateWCScore` cuando `reviews` o `totalWeight` son muy pequeños?
2. **Resistencia a Ataques Sybil:** ¿Cómo se comporta `calculateConfidence` si 3 cuentas coludidas envían reportes simultáneos?
3. **Economía de XP:** ¿Es la curva $XP = 100 \cdot L^{1.6}$ propensa a inflación o a estancamiento (*grinding burnout*) después del nivel 50?
4. **Decaimiento Temporal de la Confianza:** ¿Es el decaimiento por saltos discretos en horas preferible a una función sigmoidea o semilogarítmica suave?
5. **Rendimiento O(N):** ¿Qué coste computacional tiene el reordenamiento de los baños en `getFilteredWCs` y `nearView` cuando la base de datos supere los 100.000 registros?
