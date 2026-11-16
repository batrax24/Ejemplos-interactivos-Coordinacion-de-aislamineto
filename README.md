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
- **Qué se aprende aquí**: objetivo de aprendizaje, cómo se manifiesta el fenómeno en la escena o la gráfica y qué lectura mirar, más el error clásico del tema.

## Las cuatro capas del juego

El laboratorio tiene cuatro piezas que van de la intuición a la defensa oral del tema:

### 1. Explorar (los 14 experimentos)
Sliders, escena y gráfica. Es la capa de intuición: mover y ver.

### 2. Día de guardia (siete misiones, una por tema)
En los experimentos 04, 06, 07, 09, 10, 12 y 13 aparece una pestaña **Día de guardia**. Cada misión plantea **cinco casos** (35 escenarios en total) y un **maletín de cinco medidas**:

1. **Diagnóstico**: antes de calcular, ¿este caso va a fallar o a sostener? Se puntúa al final.
2. **Medida**: una decisión por caso. La escena, la gráfica y los criterios se recalculan *con la medida aplicada*, así que el número de la reserva se mueve en vivo.
3. **Informe**: qué casos quedaron desprotegidos y por qué.

La trampa pedagógica es explícita: algunas medidas **mejoran el número sin cambiar la física** (bajar la distancia exigida, declarar otra convención de ángulo, medir la resistencia a 50 Hz, aceptar un margen positivo pero menor que el exigido). El juego las marca como *falsa protección* y no cuentan como solución, aunque el indicador se ponga en verde.

El diagnóstico previo cuenta: el informe separa los casos **resueltos con una medida física** de los que **ya cumplían y se conservaron** (tocar lo que estaba bien también es un error), y compara tu pronóstico de «falla / sostiene» con el resultado real. Las medidas elegidas se guardan como borrador: si cierras la pestaña a mitad de jornada, al volver siguen ahí.

Las cuentas de cada criterio están a la vista (`U₅ = 700 − 1,645·42 = 631 kV`, `M = (1050/660 − 1)·100 = 59,1 %`), y el cierre de cada jornada añade el punto fino para la sustentación.

### 3. Defiende (las 21 funciones)
Mapa conceptual de las **8 ideas críticas** del material, los **6 puntos que marcan la diferencia** y **7 funciones nuevas** que cruzan temas (fase–tierra, fuga frente a arco, onda viajera, TOV, altitud, tierra y personas, selección de aislamiento). Cada tarjeta es una afirmación que suena razonable y falla en un detalle; se elige el cierre correcto, se explica el error y se abre el experimento que lo demuestra. Se desbloquea resolviendo los retos del bloque.

### 4. Sustentación (simulacro)
El propio documento de preparación lo pedía: **preguntas aleatorias de los siete temas, con cálculo y repreguntas del profesor**. Cuatro niveles:

- **Conceptual**: las 21 funciones, sin fórmulas. 5 preguntas, 4 para aprobar.
- **Matemático**: los ejercicios del curso con tolerancia (±1–4 %) y repregunta al acertar. 5 preguntas, 4 para aprobar.
- **Crítico**: casos de diagnóstico más los cálculos con su repregunta. 5 preguntas, 4 para aprobar.
- **Examen final**: 10 preguntas mezcladas de todo el banco (25 cálculos + conceptos + diagnóstico), 8 para aprobar.

Cada respuesta explica la cuenta y enlaza al experimento. La ronda evita repetir tema mientras haya margen y es determinista por semilla, así que «otra ronda» da otra mezcla. Se guarda el **récord de cada nivel** y el nivel abierto.

## Cómo jugar

1. Arrastra cualquier deslizador: todo se recalcula en tiempo real.
2. Observa la escena y la gráfica; los colores de las lecturas indican cumplimiento.
3. Pulsa **Validar** en el panel de reto. Ganas XP y sello de la estación.
4. Avanza por los cuatro bloques (Esfuerzos → Ambiente y aislamiento → Protección → Síntesis).
5. Cierra con la **misión final**, que solo se resuelve coordinando cadena, altitud, descargador y BIL a la vez.

El progreso se guarda en `localStorage` (XP, sellos, estrellas, intentos, misiones, funciones, nivel de sustentación y borradores). El audio es procedural (Web Audio API), sin archivos externos, y se puede silenciar.

### Si algo falla, no te quedas bloqueado

El laboratorio está pensado para sobrevivir a un guardado roto, a un `localStorage` bloqueado (modo privado, iframe) o a un error de render:

- **Copia de seguridad automática**: cada guardado escribe también una copia. Si el principal no se puede leer, se recupera solo y se avisa con un banner.
- **Descargar / cargar el progreso**: el botón de la barra superior descarga un `.json` con todo; la portada permite cargarlo en otro equipo. Un archivo ajeno o vacío se rechaza sin tocar nada.
- **Reiniciar**: borra el progreso con confirmación previa.
- **Pantalla de recuperación**: si React lanza un error, aparece un `ErrorBoundary` con *Reintentar*, *Descargar progreso*, *Copiar detalle* y *Reiniciar* en lugar de una página en blanco.

---

## Ejecución

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 117 pruebas: fórmulas del material, juego, render, interacción y respaldo
npm run build      # build de producción en dist/
npm run preview
npm run render:scenes   # opcional: exporta las 14 escenas a tools/renders/*.png
```

Requiere Node ≥ 18. Sin dependencias de UI externas: React + canvas + SVG.

### Pruebas

117 pruebas en `src/lib/__tests__/`:

- `experiments.test.ts` — reproduce los valores del material (200,04 kV, 575,1 kV, 646,2 kV, 21 discos, −0,60, 59,1 %, 10,29 kW/km…) y comprueba que **los 14 retos son alcanzables**.
- `smoke.test.tsx` — render de las 14 estaciones y lecturas finitas.
- `layout.test.tsx` — estructura de cada vista (escena, gráfica, sliders, lecturas, reto, ecuaciones).
- `interaction.test.tsx` — con jsdom: navegar, mover un deslizador, validar un reto, guardar progreso y recorrer las 14 estaciones.
- `gameplay.test.ts` — las cuatro capas del juego: que cada jornada (35 casos) tenga solución con el maletín, que las medidas de «falsa protección» nunca cuenten como válidas, que los pronósticos coincidan con el cálculo, que las 21 funciones tengan una sola respuesta correcta, que el banco de preguntas (25 cálculos) se responda con tolerancia y coma decimal, que los niveles pidan 5 y 10 preguntas, que las pantallas rendericen sin `NaN`, que un guardado corrupto se recupere de la copia, que exportar/importar conserve todo y que la interacción completa del día de guardia y del simulacro funcione.

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
  gameplay/
    types.ts                 motor: casos, medidas, criterios, informe del día
    targets.ts               los 19 criterios de protección con sus cuentas
    themes.ts                los 7 temas: casos, maletín, qué se aprende
    funciones.ts             las 21 funciones críticas de la exposición
    defensa.ts               banco de preguntas y generador de rondas
    GameDay.tsx              pantalla del día de guardia
    DefendView.tsx           mapa de funciones
    Sustentacion.tsx         simulacro de cuatro niveles (examen final incluido)
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
- En el juego, **una cifra verde no siempre es una solución**: las medidas de falsa protección se marcan como tales y no cuentan para superar la jornada.

Los modelos de la misión (N por impulso, capacidad TOV) son simplificaciones didácticas señaladas en las notas de cada estación.
