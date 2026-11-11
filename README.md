# LAB·CA — Laboratorio interactivo de Coordinación de Aislamiento

Juego educativo de una sola página que convierte los **ejemplos numéricos del material de clase** (guion de 120 minutos y diapositivas) en **experimentos manipulables**: mueves los parámetros de cada ecuación y ves, al mismo tiempo, la escena animada, la gráfica y el veredicto técnico.

No es una presentación: cada estación parte de un caso real del material (245 kV, 21 discos, δ = 0,90, 38,7°, Γ = −0,60, 10,29 kW/km…) y exige **reproducir o superar** ese resultado para ganar XP y estrellas.

---

## Qué se aprende (14 experimentos)

| # | Experimento | Ecuación viva | Caso del material |
|---|---|---|---|
| 01 | De entre fases a fase–tierra | U_f = Uₘ/√3 · Û_f = √2·U_f | 245 kV → 141,5 / 200,0 kV |
| 02 | Sobretensión de maniobra en p.u. | U_man = Fᵥ·Û_f | 2,5 p.u. → 500,1 kV (soporte 575,1 kV) |
| 03 | Forma de onda normalizada | v(t) de doble exponencial, t₁ = 1,67(t₉₀−t₃₀) | 1,2/50 µs y maniobra 170/2500 µs |
| 04 | Probabilidad de disrupción | U_p = U₅₀ + z_p·σ | U₁₀ = 646,2 kV |
| 05 | Altitud y densidad del aire | δ = (p/p₀)(T₀/T) | Bogotá 2 640 m → δ ≈ 0,74 |
| 06 | Cadena de aisladores | L_f = k_f·Uₘ · N = ⌈L_f/L_d⌉ | 21 discos, L_c = 3,066 m |
| 07 | Desplazamiento por viento | d_h = d₀ − L·sen θ | 1,967 m frente a 2,42 m exigidos |
| 08 | Separación entre fases | D ≈ K√(F+L) + Vₙ/150 | 4,02 m |
| 09 | Ángulo de apantallamiento | α = arctan(Δx/Δh) | 38,7° |
| 10 | Puesta a tierra y flameo inverso | V_t = I·R_t + L·di/dt | 150 kV con 10 kA y 15 Ω |
| 11 | Reflexión y transmisión de ondas | Γ = (Z₂−Z₁)/(Z₂+Z₁) | Γ = −0,60 → 40 kV |
| 12 | Margen de protección del pararrayos | M = (BIL/U_eq − 1)·100 | M = 59,1 % |
| 13 | Pérdidas por efecto corona | fórmula de Peek | 10,29 kW/km |
| 14 | **Misión: coordinar la línea** | integra δ, N, U_c, TOV y M | proyecto completo en verde |

Cada estación incluye además:
- **Escena en vivo** (canvas): torres, cadenas de discos, ondas viajeras, rayos, descargadores, halo de corona.
- **Gráfica del comportamiento**: la curva completa de la ecuación, con la lectura actual marcada.
- **Presets** con los valores exactos del material.
- **Reto verificable** con validación real, pistas y estrellas (3 sin pista y al primer intento).
- **Notas y advertencias** tomadas del guion (comparar magnitudes de la misma naturaleza, modelos ideales, convenciones de signos).

## Cómo jugar

1. Arrastra cualquier deslizador: todo se recalcula en tiempo real.
2. Observa la escena y la gráfica; los colores de las lecturas indican cumplimiento.
3. Pulsa **Validar** en el panel de reto. Ganas XP y sello de la estación.
4. Avanza por los cuatro bloques (Esfuerzos → Ambiente y aislamiento → Protección → Síntesis).
5. Cierra con la **misión final**, que solo se resuelve coordinando cadena, altitud, descargador y BIL a la vez.

El progreso se guarda en `localStorage` (XP, sellos, estrellas e intentos). El audio es procedural (Web Audio API), sin archivos externos, y se puede silenciar.

---

## Ejecución

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 60 pruebas: fórmulas del material + render de los 14 experimentos
npm run build      # build de producción en dist/
npm run preview
npm run render:scenes   # opcional: exporta las 14 escenas a tools/renders/*.png
```

Requiere Node ≥ 18. Sin dependencias de UI externas: React + canvas + SVG.

### Pruebas

80 pruebas en `src/lib/__tests__/`:

- `experiments.test.ts` — reproduce los valores del material (200,04 kV, 575,1 kV, 646,2 kV, 21 discos, −0,60, 59,1 %, 10,29 kW/km…) y comprueba que **los 14 retos son alcanzables**.
- `smoke.test.tsx` — render de las 14 estaciones y lecturas finitas.
- `layout.test.tsx` — estructura de cada vista (escena, gráfica, sliders, lecturas, reto, ecuaciones).
- `interaction.test.tsx` — con jsdom: navegar, mover un deslizador, validar un reto, guardar progreso y recorrer las 14 estaciones.

### Despliegue en GitHub Pages

Incluye `.github/workflows/deploy.yml`: en cada push a `main` instala, ejecuta las pruebas, compila y publica en GitHub Pages.

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Al fusionar en `main`, el sitio queda en `https://<usuario>.github.io/<repo>/`.

El `base` de Vite es relativo (`./`), así que funciona tanto en Pages como en cualquier subcarpeta.

---

## Estructura

```
src/
  App.tsx                    estado global, progreso, navegación
  components/
    LabHome.tsx              portada: hero, bloques, progresión
    ExperimentView.tsx       laboratorio: escena, controles, ecuación, retos
    IntroModal.tsx           tutorial de 4 pasos
    ui.tsx                   sliders, lecturas, ecuación viva, gráficas SVG
  experiments/
    types.ts                 contrato de un experimento
    e01…e14-*.tsx            definición de cada experimento (cálculo + gráfica + reto)
    scenes/s01…s14.tsx       escenas animadas en canvas
  lib/
    num.ts                   normal, cuantiles, ondas de impulso, formato es-CO
    draw.ts                  primitivas de dibujo (torres, discos, rayos, medidores)
    audio.ts                 sonido procedural
    storage.ts               progreso, rangos y estrellas
    __tests__/               fórmulas, render, layout e interacción
tools/render-scenes.mjs      exporta las escenas de canvas a PNG (opcional)
```

Cada experimento es un objeto declarativo (`compute`, `readouts`, `live`, `Scene`, `Plot`, `challenge`), de modo que añadir uno nuevo consiste en crear un archivo y registrarlo en `experiments/index.ts`.

## Criterio pedagógico y límites

El material insiste en varios puntos que la interfaz respeta explícitamente:

- Comparar tensiones **de la misma onda, unidad y configuración** (fase–tierra, fase–fase o longitudinal).
- Los ejemplos son **procedimientos didácticos**, no especificaciones de construcción.
- `U₅₀`, los márgenes y los criterios de fuga **no son universales**: dependen de la norma y del proyecto.
- La onda de corriente 8/20 µs **no** es la onda de tensión 1,2/50 µs.
- IEC 60060-1:2025 cambió la definición del impulso de maniobra (170/2500 µs frente a 250/2500 µs de textos anteriores).

Los modelos de la misión (N por impulso, capacidad TOV) son simplificaciones didácticas señaladas en las notas de cada estación.
