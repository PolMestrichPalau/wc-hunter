# WC HUNTER — ESPECIFICACIÓN MATEMÁTICA Y AUDITORÍA DE ALGORITMOS (V6.3)
*Documento técnico formal preparado para auditoría matemática profunda y validación continua mediante Claude Code*

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL SISTEMA

El núcleo matemático y algorítmico de **WC Hunter** está distribuido en motores modulares, desacoplados y testeables de forma determinista (reloj inyectable `now`):
1. `js/engines/wcEngine.js`: Estimador Bayesiano con contracción empírica, decaimiento temporal exponencial $C^0$, fiabilidad multivariable y distancias geodésicas Haversine blindadas.
2. `js/engines/gameEngine.js`: Curvas de progresión exponencial de experiencia (XP), función inversa exacta de nivel con tolerancia $\epsilon$, derivadas del coste marginal y cálculo de rangos.
3. `js/algorithms.js`: Tabla unificada de recompensas de XP (única fuente de verdad) y cálculo multidimensional de rareza/dificultad.
4. `js/state.js`: Antifraude de cuotas dobles (descubrimiento y verificación), detección geométrica de duplicados (<35 m) y racha horaria en huso local.

---

## 2. FORMULACIÓN MATEMÁTICA DETALLADA

### 2.1. Puntuación de Calidad Ponderada (WC Score Base)
El vector de 7 dimensiones de evaluación instantánea se normaliza en $[0, 100]$:
$$\vec{x} = (x_{\text{clean}}, x_{\text{paper}}, x_{\text{soap}}, x_{\text{odor}}, x_{\text{priv}}, x_{\text{cond}}, x_{\text{price}})^T$$

Vector de pesos con normalización exacta $\sum_{i=1}^7 w_i = 1.0$:
$$\vec{w} = (0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.10)^T$$

Puntuación a priori ($\mu_0$):
$$\mu_0 = \text{Score}_{\text{base}} = \text{round}\left( \sum_{i=1}^7 w_i \cdot \text{clamp}(0, 100, x_i) \right)$$

---

### 2.2. Estimador Bayesiano con Decaimiento Temporal Continuo (Empirical Bayes Shrinkage)
Para resolver la cancelación de decaimiento en muestras individuales y modelar la incertidumbre epistémica cuando los datos envejecen, WC Hunter implementa un **estimador Bayesiano empírico**:

$$\text{Score}_{\text{final}} = \text{clamp}\left(0, 100, \text{round}\left( \frac{m \cdot \mu_0 + \sum_{j=1}^M W_j S_j}{m + \sum_{j=1}^M W_j} \right)\right)$$

Donde:
- $\mu_0$: Prior poblacional (media base del baño, por defecto 70).
- $m = 2.0$: Peso de pseudo-observaciones a priori (inercia neutral).
- $S_j \in [0, 100]$: Puntuación de la reseña o verificación $j$.
- $R_j = \frac{\text{reputation}_j}{100} \in [0.05, 1.0]$: Ponderación por reputación del cazador.
- $\Delta t_j = \frac{t_{\text{now}} - t_j}{86400 \times 1000}$: Antigüedad en días solares.
- $\lambda = 0.05\text{ días}^{-1}$: Constante de desintegración con vida media:
  $$\tau_{1/2} = \frac{\ln(2)}{0.05} \approx 13.863\text{ días}$$
- $W_j = R_j \cdot \exp(-0.05 \cdot \max(0, \Delta t_j))$.

**Propiedades asintóticas garantizadas:**
1. Si no hay reseñas o el tiempo transcurrido tiende a infinito ($\Delta t \to \infty$), $W_j \to 0$ y $\text{Score} \to \mu_0 = 70$.
2. Si existen múltiples reseñas recientes ($\sum W_j \gg m$), el promedio observado domina al prior.

---

### 2.3. Índice de Confianza y Fiabilidad (Confidence Score $C^0$)
El índice de fiabilidad refleja la certeza actual sobre el estado operativo del baño:
$$\text{Confidence} = \text{clamp}\left(5, 100, \text{round}( \min(100, B + U + P) \cdot D(t) - C ) \right)$$

1. **Puntuación Base por Volumen ($B$):**
   $$B(N) = \begin{cases} 85 & \text{si } N \ge 10 \\ 75 & \text{si } 4 \le N < 10 \\ 60 & \text{si } 2 \le N < 4 \\ 40 & \text{si } N < 2 \end{cases}$$

2. **Bono de Diversidad de Usuarios Únicos ($U$):**
   $$U = \min(10, K \times 2)$$

3. **Bono por Evidencia Fotográfica ($P$):**
   $$P = \begin{cases} 10 & \text{si } \Delta t_{\text{foto}} \le 7\text{ días} \\ 5 & \text{si } 7 < \Delta t_{\text{foto}} \le 30\text{ días} \\ 0 & \text{si } \Delta t_{\text{foto}} > 30\text{ días} \end{cases}$$

4. **Decaimiento Temporal Continuo $C^0$ por Horas ($D(\Delta h)$):**
   Para eliminar saltos discretos ("cliff effects"):
   $$D(\Delta h) = \begin{cases} 
   1.00 & \text{si } \Delta h \le 2\text{ h} \\ 
   1.00 - 0.10 \left(\frac{\Delta h - 2}{22}\right) & \text{si } 2 < \Delta h \le 24\text{ h} \\ 
   0.90 - 0.20 \left(\frac{\Delta h - 24}{144}\right) & \text{si } 24 < \Delta h \le 168\text{ h (7 d)} \\ 
   0.70 - 0.25 \left(\frac{\Delta h - 168}{552}\right) & \text{si } 168 < \Delta h \le 720\text{ h (30 d)} \\ 
   \max(0.20, 0.45 \cdot \exp(-0.001(\Delta h - 720))) & \text{si } \Delta h > 720\text{ h} 
   \end{cases}$$

5. **Penalización Multivariable por Contradicción Reciente ($C$):**
   Filtrado en ventana de 72 horas para los últimos reportes:
   - Contradicción en estado operativo (abierto vs cerrado): $C = 45$
   - Contradicción en suministros (papel / jabón): $C = 35$
   - Sin contradicciones: $C = 0$

---

### 2.4. Progresión Gamificada: Curva de Experiencia y Función Inversa Exacta
La relación entre el nivel $L \in [1, \infty)$ y el XP acumulado sigue la ley de potencia:
$$\text{XP}_{\text{base}}(L) = \lfloor 100 \cdot (L - 1)^{1.6} \rfloor$$

**Función inversa con corrección de frontera $\epsilon = 10^{-7}$:**
$$L_0 = \left\lfloor \left( \frac{\text{XP}}{100} \right)^{\frac{1}{1.6}} + 10^{-7} \right\rfloor + 1$$
Ajustado con búsqueda de frontera local:
$$\text{mientras } \text{XP}_{\text{base}}(L) > \text{XP} \implies L \gets L - 1$$
$$\text{mientras } \text{XP}_{\text{base}}(L + 1) \le \text{XP} \implies L \gets L + 1$$

*Resultado verificado:* **0 fallos de frontera en $L = 1 \dots 150$** (invariante $L(\text{XP}_{\text{base}}(L)) = L$ al 100%).

Derivada del coste marginal:
$$\frac{d\text{XP}}{dL} \approx 160 \cdot (L - 1)^{0.6}$$

---

### 2.5. Cálculo Geodésico Haversine Blindado en Antípodas
Distancia métrica entre $(\phi_1, \lambda_1)$ y $(\phi_2, \lambda_2)$ sobre esfera terrestre $R = 6.371 \times 10^6\text{ m}$:

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1) \cos(\phi_2) \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$\text{safeA} = \max(0, \min(1, a))$$
$$d = \text{round}\left( 2R \cdot \text{atan2}\left(\sqrt{\text{safeA}}, \sqrt{1 - \text{safeA}}\right) \right)$$

*Blindaje numérico:*
- Si cualquier coordenada es `null`, `undefined` o fuera de rango geodésico, devuelve `NaN` explícito (nunca 0 falso).
- $\text{safeA}$ acota $a \le 1.0$, garantizando **0% NaNs en antípodas terrestres exactas**.

---

## 3. ARQUITECTURA ANTIFRAUDE Y COHERENCIA LOCAL-FIRST

1. **Cuota Diaria de Descubrimientos:** Máximo 3 descubrimientos con recompensa de XP cada 24 horas. Los intentos fallidos o excedidos no consumen ventana.
2. **Cuota Diaria de Verificaciones:** Máximo 10 verificaciones premiadas con XP cada 24 horas.
3. **Detección Geométrica de Duplicados:** Rechaza cualquier nuevo WC creado a menos de 35 metros de un baño existente.
4. **Protección de Racha (`touchStreak`):**
   - Utiliza fecha en zona horaria local del cliente (`YYYY-MM-DD`).
   - Rechaza saltos temporales hacia el pasado ($\Delta t < 0$).
   - Reinicia la racha a 1 ante saltos temporales hacia adelante o huecos de inactividad $> 1$ día.
5. **Inmunidad a NaN:** Entradas no numéricas sanitizadas por defecto con valores finitos.

---

## 4. CHECKLIST DE VALIDACIÓN Y SUITE DE PRUEBAS

Ejecución de la suite con Node.js:
```bash
node tests/logic.test.mjs
# === 41 PRUEBAS OK ===
```
Todas las aserciones matemáticas, antípodas, fronteras de nivel L=1..200, modelo Bayesiano no circular, límites de antifraude y ciclo de vida OSM pasan al 100%.
