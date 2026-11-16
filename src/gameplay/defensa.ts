/**
 * Simulacro de sustentación.
 *
 * El propio material lo pide como siguiente ejercicio: preguntas aleatorias de
 * los siete temas, con cálculo y repreguntas del profesor. Aquí se mezclan tres
 * tipos de pregunta:
 *
 *  - concepto: el cierre correcto de una de las funciones críticas;
 *  - diagnóstico: ¿este caso va a fallar o a sostener? (de los días de guardia);
 *  - cálculo: un número con tolerancia, verificado contra los ejemplos del
 *    curso, y una repregunta conceptual encima.
 *
 * Cada ronda de 5 preguntas se aprueba con 4 aciertos. Las rondas siguen los
 * niveles de preparación del documento: conceptual, matemático, crítico y examen final.
 */
import { FUNCIONES } from './funciones';
import { THEMES } from './themes';

export type Pregunta =
  | {
      kind: 'concepto';
      id: string;
      tema: string;
      prompt: string;
      options: { id: string; text: string; ok?: boolean }[];
      why: string;
      demo: string;
      expIds: string[];
    }
  | {
      kind: 'diagnostico';
      id: string;
      tema: string;
      prompt: string;
      options: { id: string; text: string; ok?: boolean }[];
      why: string;
      demo: string;
      expIds: string[];
    }
  | {
      kind: 'calculo';
      id: string;
      tema: string;
      prompt: string;
      unit: string;
      expected: number;
      tol: number;
      why: string;
      repregunta: { prompt: string; options: { id: string; text: string; ok?: boolean }[]; why: string };
      expIds: string[];
    };

export const ETAPAS = [
  {
    n: 1,
    name: 'Nivel conceptual',
    blurb: 'Las ideas críticas del material, sin fórmulas: qué significa cada cosa y por qué importa.',
    size: 5,
    min: 4,
  },
  {
    n: 2,
    name: 'Nivel matemático',
    blurb: 'Los ejercicios del curso y sus variantes. Números con coma decimal y unidades correctas.',
    size: 5,
    min: 4,
  },
  {
    n: 3,
    name: 'Nivel crítico',
    blurb: 'Casos y repreguntas: qué medida cambia la física, qué magnitud se confunde con cuál y qué margen es suficiente.',
    size: 5,
    min: 4,
  },
  {
    n: 4,
    name: 'Examen final',
    blurb: 'Diez preguntas de todo el material, mezcladas y sin aviso de tema. Ocho aciertos para cerrar.',
    size: 10,
    min: 8,
  },
] as const;

/* ------------------------------- cálculo ---------------------------------- */

const calculos: Pregunta[] = [
  {
    kind: 'calculo',
    id: 'c1',
    tema: 'T1 · tensiones',
    prompt: 'Sistema de 245 kV entre fases. ¿Cuál es la cresta fase–tierra, en kV?',
    unit: 'kV cresta',
    expected: 200.04,
    tol: 1,
    why: 'Û_f = √(2/3)·Uₘ = √(2/3)·245 = 200,04 kV. Primero ÷√3 (fase–tierra) y luego ×√2 (cresta).',
    repregunta: {
      prompt: 'El profesor pregunta: «¿y si le pido la sobretensión de maniobra a 2,5 p.u.?»',
      options: [
        { id: 'a', text: '500,1 kV cresta', ok: true },
        { id: 'b', text: '612,5 kV cresta (245 × 2,5)' },
        { id: 'c', text: '353,6 kV (245 × √2)' },
      ],
      why: 'El factor en p.u. se aplica sobre la cresta fase–tierra: 2,5 × 200,04 = 500,1 kV. Multiplicar 245 por 2,5 mezcla fase–fase con fase–tierra.',
    },
    expIds: ['tensiones', 'maniobra'],
  },
  {
    kind: 'calculo',
    id: 'c2',
    tema: 'T1 · estadística',
    prompt: 'Cadena con U₅₀ = 700 kV y dispersión del 6 %. ¿Cuál es U₁₀, en kV cresta?',
    unit: 'kV cresta',
    expected: 646.2,
    tol: 1.5,
    why: 'σ = 0,06 × 700 = 42 kV; z(10 %) = −1,282; U₁₀ = 700 − 1,282 × 42 = 646,2 kV.',
    repregunta: {
      prompt: 'Repregunta: «¿entonces el aislamiento aguanta siempre 646 kV?»',
      options: [
        { id: 'a', text: 'Sí, por debajo de U₁₀ no hay disrupción.' },
        { id: 'b', text: 'No: U₁₀ significa que falla el 10 % de las veces.', ok: true },
        { id: 'c', text: 'No, porque U₁₀ es menor que U₅₀.' },
      ],
      why: 'La distribución normal tiene cola infinita: ningún valor finito da probabilidad cero. U₁₀ fija el riesgo en el 10 %.',
    },
    expIds: ['disrupcion'],
  },
  {
    kind: 'calculo',
    id: 'c3',
    tema: 'T2 · atmósfera',
    prompt: 'Instalación a 2 640 m con temperatura de 15 °C. ¿Cuánto vale la densidad relativa δ?',
    unit: '—',
    expected: 0.724,
    tol: 3,
    why: 'δ = (p/p₀)(T₀/T) = (73,38/101,325)(293,15/288,15) = 0,724. La presión a esa altura sale del modelo ISA simplificado.',
    repregunta: {
      prompt: 'Repregunta: «¿la altitud por sí sola reduce la rigidez?»',
      options: [
        { id: 'a', text: 'Sí: h y δ son sinónimos.' },
        { id: 'b', text: 'No: lo que reduce la rigidez es la densidad; la altura solo estima la presión.', ok: true },
        { id: 'c', text: 'No, la rigidez no depende del aire.' },
      ],
      why: 'δ incluye presión y temperatura. Dos sitios a la misma altura pueden tener δ distinto en días distintos.',
    },
    expIds: ['atmosfera'],
  },
  {
    kind: 'calculo',
    id: 'c4',
    tema: 'T2 · cadena',
    prompt:
      'Línea de 245 kV, criterio k_f = 25 mm/kV, discos de 292 mm de fuga. ¿Cuántos discos exige el criterio?',
    unit: 'discos',
    expected: 21,
    tol: 0.1,
    why: '6 125/292 = 20,98 → 21 discos. Se redondea siempre hacia arriba: no existe medio aislador.',
    repregunta: {
      prompt: 'Repregunta: «¿y la longitud de la cadena?»',
      options: [
        { id: 'a', text: '21 × 0,146 = 3,066 m', ok: true },
        { id: 'b', text: '21 × 0,292 = 6,132 m' },
        { id: 'c', text: '25 × 0,146 = 3,650 m' },
      ],
      why: 'El paso (0,146 m) es la separación entre discos; 292 mm es la distancia de fuga, que es otra magnitud.',
    },
    expIds: ['cadena'],
  },
  {
    kind: 'calculo',
    id: 'c5',
    tema: 'T3 · separación',
    prompt:
      'Cadena de 3,066 m inclinada 30° sobre una distancia en reposo de 3,50 m. ¿Cuál es la distancia horizontal resultante, en m?',
    unit: 'm',
    expected: 1.967,
    tol: 2,
    why: 'Δx = 3,066·sen 30° = 1,533 m; d_h = 3,50 − 1,533 = 1,967 m. Faltan 0,45 m para los 2,42 exigidos.',
    repregunta: {
      prompt: 'Repregunta: «¿qué cambio reduce de verdad el riesgo?»',
      options: [
        { id: 'a', text: 'Bajar la exigencia a 1,967 m.' },
        { id: 'b', text: 'Aumentar d₀ o acortar la cadena.', ok: true },
        { id: 'c', text: 'Poner un aislador de mayor diámetro.' },
      ],
      why: 'La geometría manda: d₀ y L son las palancas. Cambiar el requisito solo cambia el número, no la distancia.',
    },
    expIds: ['oscilacion'],
  },
  {
    kind: 'calculo',
    id: 'c6',
    tema: 'T3 · separación entre fases',
    prompt: 'Con K = 0,75, F = 8 m, L = 3 m y Vₙ = 230 kV, ¿cuánto vale la separación preliminar D, en m?',
    unit: 'm',
    expected: 4.02,
    tol: 2,
    why: 'D = 0,75·√(8+3) + 230/150 = 2,487 + 1,533 = 4,02 m. Dos términos: uno geométrico y uno lineal con la tensión.',
    repregunta: {
      prompt: 'Repregunta: «¿qué término domina si duplico la tensión?»',
      options: [
        { id: 'a', text: 'El geométrico, porque va con la raíz.' },
        { id: 'b', text: 'El eléctrico, porque Vₙ/150 crece linealmente.', ok: true },
        { id: 'c', text: 'Ninguno: se cancelan.' },
      ],
      why: 'La raíz comprime el término geométrico; el término Vₙ/150 es lineal y a 500 kV ya aporta 3,33 m.',
    },
    expIds: ['separacion'],
  },
  {
    kind: 'calculo',
    id: 'c7',
    tema: 'T4 · guarda',
    prompt: 'Guarda 5 m sobre la fase y 4 m a un lado. ¿Cuál es el ángulo de apantallamiento, en grados?',
    unit: '°',
    expected: 38.66,
    tol: 2,
    why: 'α = arctan(4/5) = 38,66°. Por encima de 30°, el material pide revisar la geometría.',
    repregunta: {
      prompt: 'Repregunta: «¿y el radio de atracción con 31 kA?»',
      options: [
        { id: 'a', text: '93,2 m, con r_c = 10·I^0,65', ok: true },
        { id: 'b', text: '310 m, con r_c = 10·I' },
        { id: 'c', text: '6,4 m, la separación guarda–fase' },
      ],
      why: 'r_c = 10·31^0,65 = 93,2 m. Comparar ese radio con la separación (6,4 m) es el método electrogeométrico.',
    },
    expIds: ['guarda'],
  },
  {
    kind: 'calculo',
    id: 'c8',
    tema: 'T5 · tierra',
    prompt:
      'Rayo de 20 kA por una torre con R_t = 20 Ω, L = 1 µH y di/dt = 10 kA/µs. ¿Cuál es el potencial de torre, en kV?',
    unit: 'kV',
    expected: 410,
    tol: 1.5,
    why: 'V_t = I·R_t + L·di/dt = 20·20 + 1·10 = 410 kV. La caída inductiva aporta 10 kV: un 2,4 % del total.',
    repregunta: {
      prompt: 'Repregunta: «¿con qué cadena flamea?»',
      options: [
        { id: 'a', text: 'Con una cadena de 700 kV no flamea: 410 < 700.', ok: true },
        { id: 'b', text: 'Flamea siempre que V_t supere 200 kV.' },
        { id: 'c', text: 'No se puede saber sin la corriente.' },
      ],
      why: 'El criterio del material compara V_t con la capacidad de la cadena (700 kV). Con 410 kV hay margen; con R_t = 40 Ω serían 810 kV y flamearía.',
    },
    expIds: ['tierra'],
  },
  {
    kind: 'calculo',
    id: 'c9',
    tema: 'T3 · ondas',
    prompt: 'Onda de 100 kV que pasa de Z₁ = 400 Ω a Z₂ = 100 Ω. ¿Cuánto vale Γᵥ? (adimensional)',
    unit: '—',
    expected: -0.6,
    tol: 3,
    why: 'Γ = (100 − 400)/(100 + 400) = −0,60. Negativo significa que la tensión reflejada invierte el signo.',
    repregunta: {
      prompt: 'Repregunta: «¿cuánto vale τ y qué tensión pasa?»',
      options: [
        { id: 'a', text: 'τ = 0,40 y pasan 40 kV', ok: true },
        { id: 'b', text: 'τ = 1,60 y pasan 160 kV' },
        { id: 'c', text: 'τ = −0,60 y pasan −60 kV' },
      ],
      why: 'τ = 1 + Γ = 0,40. En la unión la tensión total es V_i + V_r = 40 kV: baja porque la segunda línea es "más blanda".',
    },
    expIds: ['ondas'],
  },
  {
    kind: 'calculo',
    id: 'c10',
    tema: 'T6 · pararrayos',
    prompt:
      'U_res = 600 kV, L_c = 1 µH/m, di/dt = 10 kA/µs y d = 6 m. ¿Qué tensión llega al equipo, en kV?',
    unit: 'kV',
    expected: 660,
    tol: 1,
    why: 'U_eq = 600 + 1·10·6 = 660 kV. La conexión añade 60 kV: el 9 % de la tensión que ve el equipo.',
    repregunta: {
      prompt: 'Repregunta: «con BIL = 1 050 kV, ¿cuál es el margen?»',
      options: [
        { id: 'a', text: '(1050/660 − 1)·100 = 59,1 %', ok: true },
        { id: 'b', text: '(1050 − 660)/1050·100 = 37,1 %' },
        { id: 'c', text: '1050/660 = 1,59 %' },
      ],
      why: 'El margen del material es relativo a la tensión que llega: M = (BIL/U_eq − 1)·100. El criterio exige ≥ 20 %.',
    },
    expIds: ['pararrayos'],
  },
  {
    kind: 'calculo',
    id: 'c11',
    tema: 'T7 · corona',
    prompt:
      'f = 60 Hz, δ = 0,90, r = 1,5 cm, s = 600 cm, U = 220 kV y U₀ = 190 kV. ¿Cuánto valen las pérdidas, en kW/km?',
    unit: 'kW/km',
    expected: 10.29,
    tol: 4,
    why: 'P = (242/0,9)(85)√(1,5/600)(30)²·10⁻⁵ = 10,29 kW/km.',
    repregunta: {
      prompt: 'Repregunta: «si bajara U₀ a 170 kV, ¿qué pasa?»',
      options: [
        { id: 'a', text: 'P sube a 28,6 kW/km: el exceso se triplica y va al cuadrado.', ok: true },
        { id: 'b', text: 'P baja porque el umbral es menor.' },
        { id: 'c', text: 'P no cambia: U₀ no está en la fórmula.' },
      ],
      why: '(50/30)² = 2,78: pasar de 30 a 50 kV de exceso casi triplica las pérdidas. Por eso el umbral manda.',
    },
    expIds: ['corona'],
  },
  {
    kind: 'calculo',
    id: 'c13',
    tema: 'T1 · estadística inversa',
    prompt: 'Cadena con U₅₀ = 700 kV y s = 6 %. ¿Qué tensión produce el 2 % de disrupción, en kV cresta?',
    unit: 'kV cresta',
    expected: 613.7,
    tol: 1.5,
    why: 'σ = 42 kV y z(2 %) = −2,054: U₂ = 700 − 2,054·42 = 613,7 kV. Bajar del 10 % al 2 % cuesta 32 kV más.',
    repregunta: {
      prompt: '«¿Y si solo tengo el dato de U₁₀?»',
      options: [
        { id: 'a', text: 'No se puede estimar otro cuantil sin σ.' },
        { id: 'b', text: 'Con U₁₀ y σ, cada cuantil se obtiene con su z.', ok: true },
        { id: 'c', text: 'U₂ es siempre un 20 % menor que U₁₀.' },
      ],
      why: 'Los cuantiles de una normal se separan z·σ: con dos datos (U₁₀ y σ) se reconstruye cualquier otro. Sin σ no hay forma.',
    },
    expIds: ['disrupcion'],
  },
  {
    kind: 'calculo',
    id: 'c14',
    tema: 'T1 · maniobra y soporte',
    prompt:
      'Sistema de 245 kV con sobretensión de maniobra de 2,5 p.u. ¿Qué tensión soportada de maniobra exige el criterio U_soporte = 1,15·U_man, en kV cresta?',
    unit: 'kV cresta',
    expected: 575.1,
    tol: 1,
    why: 'Û_f = 200,04 kV; U_man = 2,5·200,04 = 500,1 kV; U_soporte = 1,15·500,1 = 575,1 kV.',
    repregunta: {
      prompt: '«¿Ese 1,15 es un margen cualquiera?»',
      options: [
        { id: 'a', text: 'Sí, es un número de comodidad.' },
        { id: 'b', text: 'Es el factor de seguridad del criterio del material: 15 % sobre la sobretensión.', ok: true },
        { id: 'c', text: 'No, es la corrección por altitud.' },
      ],
      why: 'El 15 % es margen de coordinación sobre el esfuerzo calculado. La altitud se corrige aparte, con δ.',
    },
    expIds: ['maniobra'],
  },
  {
    kind: 'calculo',
    id: 'c15',
    tema: 'T2 · cadena corta',
    prompt: 'Línea de 145 kV, k_f = 25 mm/kV y discos de 250 mm. ¿Cuántos discos exige la fuga?',
    unit: 'discos',
    expected: 15,
    tol: 0.1,
    why: '25·145 = 3 625 mm; 3 625/250 = 14,5 → 15 discos. Otra vez el redondeo hacia arriba.',
    repregunta: {
      prompt: '«¿Cuánto mide esa cadena con paso de 0,146 m?»',
      options: [
        { id: 'a', text: '2,19 m', ok: true },
        { id: 'b', text: '3,75 m (15 × 0,250)' },
        { id: 'c', text: '1,46 m' },
      ],
      why: '15 × 0,146 = 2,19 m. El paso es la separación entre discos; 0,250 m es la fuga por disco y hay que multiplicarla por 15 para la fuga total (3 750 mm).',
    },
    expIds: ['cadena'],
  },
  {
    kind: 'calculo',
    id: 'c16',
    tema: 'T2 · densidad y caída de rigidez',
    prompt:
      'Instalación a 2 640 m y 15 °C con U₅₀ = 700 kV al nivel del mar (δ = 0,724). ¿Cuánto vale U₅₀ corregida, en kV?',
    unit: 'kV',
    expected: 549.5,
    tol: 1,
    why: 'U₅₀(δ) = 700·0,724^0,75 = 549,5 kV: un 21,5 % menos. La misma geometría, otro aire.',
    repregunta: {
      prompt: '«¿Se arregla subiendo la tensión de ensayo?»',
      options: [
        { id: 'a', text: 'Sí: el ensayo compensa la altitud.' },
        { id: 'b', text: 'No: hay que compensar el aislamiento (más distancia o más nivel), no el ensayo.', ok: true },
        { id: 'c', text: 'Sí, basta con medir otro día.' },
      ],
      why: 'El ensayo no cambia la instalación. La altitud se compensa con distancia de fuga, longitud de arco o nivel de aislamiento.',
    },
    expIds: ['atmosfera'],
  },
  {
    kind: 'calculo',
    id: 'c17',
    tema: 'T3 · viento y separación',
    prompt:
      'Cadena de 2,50 m inclinada 45° con una distancia en reposo de 3,60 m. ¿Cuál es la separación resultante, en m?',
    unit: 'm',
    expected: 1.83,
    tol: 2,
    why: 'Δx = 2,50·sen 45° = 1,77 m; d_h = 3,60 − 1,77 = 1,83 m. Faltan 0,67 m para los 2,50 exigidos.',
    repregunta: {
      prompt: '«¿Aumentar d₀ a 4,30 m resuelve el caso?»',
      options: [
        { id: 'a', text: 'Sí: 4,30 − 1,77 = 2,53 m > 2,50 m.', ok: true },
        { id: 'b', text: 'No, porque el viento también crece.' },
        { id: 'c', text: 'Solo si se acorta la cadena.' },
      ],
      why: 'La distancia disponible es lineal con d₀: +0,7 m en la cruceta dan 2,53 m y el caso pasa. La cadena acortada también serviría, pero reduce fuga.',
    },
    expIds: ['oscilacion', 'separacion'],
  },
  {
    kind: 'calculo',
    id: 'c18',
    tema: 'T3 · separación entre fases',
    prompt:
      'Con K = 0,75, F = 12 m, L = 4 m y Vₙ = 500 kV, ¿cuánto vale la separación preliminar D, en m?',
    unit: 'm',
    expected: 6.33,
    tol: 2,
    why: 'D = 0,75·√(12+4) + 500/150 = 3,00 + 3,33 = 6,33 m. A 500 kV el término eléctrico ya supera al geométrico.',
    repregunta: {
      prompt: '«¿Qué término crece más rápido al subir de 245 a 500 kV?»',
      options: [
        { id: 'a', text: 'El geométrico.' },
        { id: 'b', text: 'El eléctrico: pasa de 1,63 a 3,33 m.', ok: true },
        { id: 'c', text: 'Los dos igual.' },
      ],
      why: 'Vₙ/150 es lineal: 245/150 = 1,63 m frente a 500/150 = 3,33 m. El término de la raíz solo cambia si cambian F o L.',
    },
    expIds: ['separacion'],
  },
  {
    kind: 'calculo',
    id: 'c19',
    tema: 'T4 · guarda y sombra',
    prompt:
      'Guarda con Δh = 4 m y Δx = 3 m, corriente de diseño 20 kA. ¿Cuál es el ángulo de apantallamiento, en grados?',
    unit: '°',
    expected: 36.87,
    tol: 2,
    why: 'α = arctan(3/4) = 36,87°. Con r_c = 10·20^0,65 = 70,1 m, el radio es enorme; el ángulo es el que delata la exposición.',
    repregunta: {
      prompt: '«¿Cuál es el semiancho de sombra protegido?»',
      options: [
        { id: 'a', text: 'r_c·sen α = 70,1·0,60 = 42,1 m', ok: true },
        { id: 'b', text: 'r_c·cos α = 56,1 m' },
        { id: 'c', text: 'Δx = 3 m' },
      ],
      why: 'La sombra horizontal por lado es la proyección del radio de atracción sobre la horizontal: b = r_c·sen α. Aun así, el criterio de ángulo ≤ 30° sigue sin cumplirse.',
    },
    expIds: ['guarda'],
  },
  {
    kind: 'calculo',
    id: 'c20',
    tema: 'T5 · tierra con inductancia',
    prompt:
      'Rayo de 15 kA, R_t = 25 Ω, L = 4 µH y di/dt = 12 kA/µs. ¿Cuál es el potencial de torre, en kV?',
    unit: 'kV',
    expected: 423,
    tol: 1.5,
    why: 'V_t = 15·25 + 4·12 = 375 + 48 = 423 kV. El 11 % del potencial viene de la inductancia, no de la resistencia.',
    repregunta: {
      prompt: '«Si la cadena es de 700 kV, ¿qué tan cerca está el flameo?»',
      options: [
        { id: 'a', text: 'Flamea: 423 supera 700.' },
        { id: 'b', text: 'No flamea, pero quedan 277 kV de margen (un 65 % de la cadena).', ok: true },
        { id: 'c', text: 'No se puede saber sin la densidad del aire.' },
      ],
      why: 'El criterio compara V_t contra la capacidad de la cadena: 423 < 700 kV. El margen es positivo, aunque un rayo mayor o un suelo peor lo consumen rápido.',
    },
    expIds: ['tierra'],
  },
  {
    kind: 'calculo',
    id: 'c21',
    tema: 'T3 · ondas en extremo abierto',
    prompt: 'Onda de 120 kV que llega a un extremo abierto (Γ = +1). ¿Qué tensión máxima aparece en el extremo, en kV?',
    unit: 'kV',
    expected: 240,
    tol: 1,
    why: 'V = V_i·(1 + Γ) = 120·2 = 240 kV. La reflexión duplica la tensión, no la energía.',
    repregunta: {
      prompt: '«¿Por qué importa esto para el pararrayos?»',
      options: [
        { id: 'a', text: 'Porque la onda puede duplicarse antes de que el descargador actúe lejos.', ok: true },
        { id: 'b', text: 'Porque el pararrayos refleja energía al generador.' },
        { id: 'c', text: 'No importa: solo pasa en laboratorio.' },
      ],
      why: 'En un extremo abierto o en una transición a impedancia alta la tensión se duplica: es la razón por la que se limita la distancia pararrayos–equipo y se revisan los puntos de reflexión.',
    },
    expIds: ['ondas', 'pararrayos'],
  },
  {
    kind: 'calculo',
    id: 'c22',
    tema: 'T6 · distancia y BIL mínimo',
    prompt:
      'Pararrayos con U_res = 500 kV, L_c = 1,2 µH/m y di/dt = 10 kA/µs a 5 m del equipo. ¿Qué tensión ve el equipo, en kV?',
    unit: 'kV',
    expected: 560,
    tol: 1,
    why: 'U_eq = 500 + 1,2·10·5 = 500 + 60 = 560 kV. La distancia aporta tanto como 60 kV de tensión residual extra.',
    repregunta: {
      prompt: '«Con margen exigido del 20 %, ¿qué BIL mínimo hace falta?»',
      options: [
        { id: 'a', text: '672 kV', ok: true },
        { id: 'b', text: '560 kV' },
        { id: 'c', text: '700 kV' },
      ],
      why: 'BIL ≥ 1,20·U_eq = 1,20·560 = 672 kV. El margen se pide sobre la tensión que llega, no sobre la residual.',
    },
    expIds: ['pararrayos'],
  },
  {
    kind: 'calculo',
    id: 'c23',
    tema: 'T7 · corona con haz',
    prompt:
      'Peek con f = 60 Hz, δ = 0,9, r = 2 cm, s = 600 cm, U = 220 kV y U₀ = 215 kV. ¿Cuánto valen las pérdidas, en kW/km?',
    unit: 'kW/km',
    expected: 0.33,
    tol: 6,
    why: 'P = (242/0,9)·85·√(2/600)·5²·10⁻⁵ = 0,33 kW/km. Con solo 5 kV de exceso, el cuadrado del exceso es diminuto.',
    repregunta: {
      prompt: '«¿Y si U₀ bajara a 190 kV?»',
      options: [
        { id: 'a', text: 'Subiría a unos 12 kW/km: el exceso pasa de 5 a 30 kV y va al cuadrado.', ok: true },
        { id: 'b', text: 'Subiría un 5 %.' },
        { id: 'c', text: 'No cambiaría.' },
      ],
      why: '(30/5)² = 36: el exceso se multiplica por seis y las pérdidas por 36 (0,33 → 11,9 kW/km). Es la sensibilidad que el material quiere que se entienda.',
    },
    expIds: ['corona'],
  },
  {
    kind: 'calculo',
    id: 'c24',
    tema: 'T1 · lectura de la curva',
    prompt:
      'Con U₅₀ = 700 kV y s = 6 %, ¿qué probabilidad de disrupción corresponde a 640 kV? (en %, aproximado)',
    unit: '%',
    expected: 7.7,
    tol: 20,
    why: 'z = (640 − 700)/42 = −1,43 → Φ(−1,43) ≈ 7,7 %. Entre U₁₀ (646 kV) y la mediana, la probabilidad cae rápido.',
    repregunta: {
      prompt: '«¿Se puede afirmar que 640 kV es seguro porque está bajo U₅₀?»',
      options: [
        { id: 'a', text: 'Sí: bajo la mediana no hay falla.' },
        { id: 'b', text: 'No: está bajo la mediana y aun así falla en 1 de cada 13 ensayos.', ok: true },
        { id: 'c', text: 'Solo en corriente continua.' },
      ],
      why: 'U₅₀ es la mediana (50 %). Estar por debajo solo reduce la probabilidad; para "casi nunca" hay que ir a U₁₀ o menos.',
    },
    expIds: ['disrupcion'],
  },
  {
    kind: 'calculo',
    id: 'c25',
    tema: 'T2 · longitud de cadena en torre',
    prompt:
      '27 discos de 292 mm con paso de 0,146 m. ¿Cuánto mide la cadena, en m?',
    unit: 'm',
    expected: 3.942,
    tol: 1,
    why: '27 · 0,146 = 3,942 m. Con una torre que admite 3,9 m, faltan 4 cm: el criterio de fuga aprueba y el geométrico no.',
    repregunta: {
      prompt: '«¿Qué solución cambia menos la torre?»',
      options: [
        { id: 'a', text: 'Discos de 380 mm: menos discos y cadena más corta.', ok: true },
        { id: 'b', text: 'Añadir más discos.' },
        { id: 'c', text: 'Lavar los aisladores.' },
      ],
      why: 'Con 380 mm se necesitan ⌈6125/380⌉ = 17 discos → 2,48 m. La cadena cabe y la fuga se cumple. Añadir discos empeora la altura.',
    },
    expIds: ['cadena'],
  },
  {
    kind: 'calculo',
    id: 'c12',
    tema: 'T7 · corona y radio',
    prompt:
      'Mismo caso del conductor (r = 1,5 cm, s = 600 cm, δ = 0,9, U = 220 kV, U₀ = 170 kV). ¿Cuánto valen las pérdidas, en kW/km?',
    unit: 'kW/km',
    expected: 28.57,
    tol: 4,
    why: 'P = (242/0,9)(85)√(1,5/600)(50)²·10⁻⁵ = 28,57 kW/km.',
    repregunta: {
      prompt: 'Repregunta: «¿engrosar el conductor a r = 2 cm reduce las pérdidas?»',
      options: [
        { id: 'a', text: 'Sí, siempre: más radio, menos gradiente.' },
        { id: 'b', text: 'Con U₀ fijo, no: √(r/s) sube y las pérdidas también.', ok: true },
        { id: 'c', text: 'No cambia nada.' },
      ],
      why: 'Engrosar reduce el gradiente, y eso debería subir U₀. Si U₀ no cambia, el factor √(r/s) hace subir las pérdidas: es la trampa de Peek.',
    },
    expIds: ['corona'],
  },
];

/* --------------------------- banco conceptual ----------------------------- */

const conceptos: Pregunta[] = FUNCIONES.map((f) => ({
  kind: 'concepto' as const,
  id: `f-${f.id}`,
  tema: f.tema,
  prompt: f.claim,
  options: f.options.map((o) => ({ id: o.id, text: o.text, ok: o.ok })),
  why: f.options.find((o) => o.ok)!.why,
  demo: f.demo,
  expIds: f.expIds,
}));

const diagnosticos: Pregunta[] = THEMES.flatMap((t) =>
  t.daily.cases
    .filter((c) => c.forecast)
    .map((c) => {
      const falla = c.forecast === 'falla';
      return {
        kind: 'diagnostico' as const,
        id: `d-${c.id}`,
        tema: `${t.num} · ${t.title}`,
        prompt: `${c.name}. ${c.brief}`,
        options: [
          { id: 'falla', text: 'Va a fallar: el esfuerzo supera la capacidad.', ok: falla },
          { id: 'sostiene', text: 'Va a sostener: hay margen con esos datos.', ok: !falla },
        ],
        why: c.lesson,
        demo: `Este caso es uno de los del día de guardia del tema ${t.num}: puedes abrirlo completo en el experimento ${t.expId}.`,
        expIds: [t.expId],
      };
    }),
);

export const BANCO: Pregunta[] = [...conceptos, ...diagnosticos, ...calculos];

/** Mezcla determinista con semilla: cada intento cambia, pero es reproducible. */
const shuffle = <T,>(arr: T[], seed: number): T[] => {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** Arma una ronda de 5 preguntas para la etapa indicada. */
export const etapaSpec = (n: number) => ETAPAS.find((e) => e.n === n) ?? ETAPAS[0];

/** Cuántas preguntas pide cada nivel. */
export const rondaSize = (etapa: number) => etapaSpec(etapa).size;

/** Mezcla las tres familias: concepto, diagnóstico y cálculo. */
const poolDe = (etapa: number): Pregunta[] =>
  etapa === 1
    ? conceptos
    : etapa === 2
      ? calculos
      : etapa === 3
        ? [...diagnosticos, ...calculos]
        : [...conceptos, ...diagnosticos, ...calculos];

/**
 * Arma una ronda del tamaño del nivel.
 *
 * Primero intenta no repetir tema (así cada ronda obliga a moverse por todo el
 * material); si no alcanza, rellena con el resto. La semilla hace que la misma
 * ronda se pueda reproducir y que dos intentos distintos no se parezcan.
 */
export function ronda(etapa: number, seed: number): Pregunta[] {
  const size = rondaSize(etapa);
  const pool = poolDe(etapa);
  const mixed = shuffle(pool, seed);
  const picked: Pregunta[] = [];
  for (const p of mixed) {
    if (picked.length >= size) break;
    if (picked.some((q) => q.tema === p.tema)) continue;
    picked.push(p);
  }
  for (const p of mixed) {
    if (picked.length >= size) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, size);
}

/** Verifica una respuesta y devuelve el veredicto con la explicación. */
export function revisar(p: Pregunta, answer: string | number): { ok: boolean; why: string } {
  if (p.kind === 'calculo') {
    const v = typeof answer === 'number' ? answer : Number(String(answer).replace(',', '.'));
    if (!Number.isFinite(v)) return { ok: false, why: `No se pudo leer un número. ${p.why}` };
    const ok = Math.abs(v - p.expected) <= Math.abs(p.expected) * (p.tol / 100);
    return { ok, why: p.why };
  }
  const opt = p.options.find((o) => o.id === answer);
  return { ok: Boolean(opt?.ok), why: p.why };
}
