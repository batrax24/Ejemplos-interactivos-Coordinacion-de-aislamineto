/**
 * Simulacro de sustentación.
 *
 * El propio material lo pide como siguiente ejercicio: preguntas aleatorias de
 * los siete temas, con cálculo y repreguntas del profesor. Aquí se mezclan tres
 * tipos de pregunta:
 *
 *  - concepto: el cierre correcto de una de las 14 funciones;
 *  - diagnóstico: ¿este caso va a fallar o a sostener? (de los días de guardia);
 *  - cálculo: un número con tolerancia, verificado contra los ejemplos del
 *    curso, y una repregunta conceptual encima.
 *
 * Cada ronda de 5 preguntas se aprueba con 4 aciertos. Las rondas siguen los
 * tres niveles de preparación del documento: conceptual, matemático y crítico.
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
    blurb: 'Las ocho ideas que el material considera mapa conceptual. Sin fórmulas todavía: qué significa cada cosa.',
  },
  {
    n: 2,
    name: 'Nivel matemático',
    blurb: 'Los seis ejercicios del curso y sus variantes. Números con coma decimal y unidades correctas.',
  },
  {
    n: 3,
    name: 'Nivel crítico',
    blurb: 'Casos y repreguntas: qué medida cambia la física, qué magnitud se confunde con cuál y qué margen es suficiente.',
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
export function ronda(etapa: number, seed: number): Pregunta[] {
  const pool =
    etapa === 1
      ? conceptos
      : etapa === 2
        ? calculos
        : [...diagnosticos, ...calculos.filter((c) => c.kind === 'calculo')];
  const mixed = shuffle(pool, seed);
  const picked: Pregunta[] = [];
  for (const p of mixed) {
    if (picked.length >= 5) break;
    if (picked.some((q) => q.tema === p.tema)) continue;
    picked.push(p);
  }
  // Si el filtro por tema dejó menos de 5, completa con el resto.
  for (const p of mixed) {
    if (picked.length >= 5) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
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
