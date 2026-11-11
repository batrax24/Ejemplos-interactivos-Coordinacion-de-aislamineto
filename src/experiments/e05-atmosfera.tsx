import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene05 } from './scenes/s05';

/** Presión estándar al nivel del mar (kPa). */
const P0 = 101.325;
/** Temperatura de referencia (K). */
const T0 = 293.15;

interface Data {
  alt: number;
  tempC: number;
  pressure: number;
  delta: number;
  factor: number;
  baseU50: number;
  u50: number;
  loss: number;
  tempK: number;
}

/** Presión aproximada según altitud (modelo ISA simplificado, hasta 6000 m). */
export function pressureAtAltitude(m: number): number {
  const p = 101.325 * Math.pow(1 - 2.25577e-5 * m, 5.25588);
  return p;
}

const compute = (p: Params): Data => {
  const pressure = p.manual === 1 ? p.pressure : pressureAtAltitude(p.alt);
  const tempK = p.tempC + 273.15;
  const delta = (pressure / P0) * (T0 / tempK);
  const baseU50 = 700;
  const u50 = baseU50 * Math.pow(delta, 0.75);
  return {
    alt: p.alt,
    tempC: p.tempC,
    pressure,
    delta,
    factor: Math.pow(delta, 0.75),
    baseU50,
    u50,
    loss: ((u50 / baseU50) - 1) * 100,
    tempK,
  };
};

export const exp05: ExperimentDef<Data> = {
  id: 'atmosfera',
  num: '05',
  title: 'Altitud y densidad del aire',
  kicker: 'Corrección atmosférica',
  slides: 'Diapositivas 20 y 21',
  idea:
    'La capacidad disruptiva del aire depende de su densidad. Al subir en altitud baja la presión y δ disminuye; para una misma geometría el aislamiento soporta menos. La temperatura también entra en δ.',
  formulas: ['δ = (p / p₀) · (T₀ / T)', 'U₅₀(δ) ≈ U₅₀ · δ^0,75', 'p(h) ≈ 101,325 (1 − 2,2558·10⁻⁵ h)^5,2559'],
  live: (p) => {
    const r = compute(p);
    return [
      `δ = (${fmt(r.pressure, 2)} / 101,325) × (293,15 / ${fmt(r.tempK, 2)}) = ${fmt(r.delta, 3)}`,
      `U₅₀ = 700 × ${fmt(r.delta, 3)}^0,75 = ${fmt(r.u50, 1)} kV`,
      `Pérdida de rigidez ≈ ${fmt(-r.loss, 1)} %`,
    ];
  },
  params: [
    {
      id: 'alt',
      label: 'Altitud de la instalación',
      symbol: 'h',
      unit: 'm s.n.m.',
      min: 0,
      max: 4000,
      step: 25,
      value: 2640,
      decimals: 0,
      hint: 'Bogotá ≈ 2 640 m · Medellín ≈ 1 495 m · nivel del mar = 0 m',
    },
    { id: 'tempC', label: 'Temperatura ambiente', symbol: 'T', unit: '°C', min: -10, max: 45, step: 1, value: 15, decimals: 0 },
    {
      id: 'manual',
      label: 'Usar presión medida en sitio',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      value: 0,
      kind: 'toggle',
    },
    {
      id: 'pressure',
      label: 'Presión barométrica medida',
      symbol: 'p',
      unit: 'kPa',
      min: 40,
      max: 105,
      step: 0.1,
      value: 73.5,
      decimals: 1,
      showIf: (p) => p.manual === 1,
    },
  ],
  compute,
  readouts: (r) => [
    { label: 'Presión local', symbol: 'p', value: fmt(r.pressure, 2), unit: 'kPa', tone: 'info' },
    { label: 'Densidad relativa', symbol: 'δ', value: fmt(r.delta, 3), tone: r.delta > 0.9 ? 'ok' : r.delta > 0.75 ? 'warn' : 'bad' },
    { label: 'U₅₀ corregida', symbol: 'U₅₀', value: fmt(r.u50, 1), unit: 'kV', tone: 'warn' },
    { label: 'Pérdida de rigidez', value: fmt(r.loss, 1), unit: '%', tone: r.loss < -5 ? 'bad' : 'ok' },
  ],
  verdict: (r) => {
    if (r.delta < 0.72) return { tone: 'bad', text: 'δ menor que 0,72: hay que compensar con distancia o nivel de aislamiento mayor.' };
    if (r.delta < 0.85) return { tone: 'warn', text: 'Aire enrarecido: revisa factor de corrección y distancia de fuga.' };
    return { tone: 'ok', text: 'Densidad cercana a la de referencia: corrección pequeña.' };
  },
  Scene: Scene05,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let h = 0; h <= 4000; h += 25) {
      const pr = pressureAtAltitude(h);
      const d = (pr / P0) * (T0 / (data.tempC + 273.15));
      pts.push([h, 700 * Math.pow(d, 0.75)]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 1000, 2000, 3000, 4000].map((h) => (
            <g key={h}>
              <line x1={54 + (h / 4000) * 550} x2={54 + (h / 4000) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (h / 4000) * 550} y={214} textAnchor="middle" className="plot__tick">
                {fmt(h, 0)}
              </text>
            </g>
          ))}
          {[400, 500, 600, 700].map((v) => (
            <g key={v}>
              <line x1={54} x2={604} y1={196 - ((v - 380) / 340) * 176} y2={196 - ((v - 380) / 340) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - ((v - 380) / 340) * 176} textAnchor="end" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([h, v], i) => `${i ? 'L' : 'M'}${(54 + (h / 4000) * 550).toFixed(1)},${(196 - ((v - 380) / 340) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.teal}
            strokeWidth="2.3"
          />
          <line x1={54} x2={604} y1={196 - ((700 - 380) / 340) * 176} y2={196 - ((700 - 380) / 340) * 176} stroke="rgba(148,180,220,0.3)" strokeDasharray="4 4" />
          <line
            x1={54 + (data.alt / 4000) * 550}
            x2={54 + (data.alt / 4000) * 550}
            y1={16}
            y2={196}
            stroke={C.amber}
            strokeDasharray="4 4"
          />
          <circle cx={54 + (data.alt / 4000) * 550} cy={196 - ((data.u50 - 380) / 340) * 176} r={4.5} fill={C.amber} />
          <text x={54 + (data.alt / 4000) * 550 + 8} y={196 - ((data.u50 - 380) / 340) * 176 - 8} className="plot__note" fill={C.amber}>
            {fmt(data.u50, 1)} kV
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            altitud (m s.n.m.)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            U₅₀ corregida (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Bogotá (2 640 m, 14 °C)', params: { alt: 2640, tempC: 14 } },
    { name: 'Nivel del mar (25 °C)', params: { alt: 0, tempC: 25 } },
    { name: 'Páramo (3 800 m, 5 °C)', params: { alt: 3800, tempC: 5 } },
  ],
  challenge: {
    prompt: 'Encuentra una altitud donde δ quede entre 0,78 y 0,82 y la U₅₀ corregida no baje de 580 kV.',
    hint: 'Con 20 °C, δ ≈ 0,80 corresponde a unos 1 900–2 000 m. Mueve solo la altitud.',
    goal: '0,78 ≤ δ ≤ 0,82',
    test: (p) => {
      const r = compute(p);
      const ok = r.delta >= 0.78 && r.delta <= 0.82 && r.u50 >= 580;
      return {
        pass: ok,
        detail: ok
          ? `δ = ${fmt(r.delta, 3)} y U₅₀ = ${fmt(r.u50, 1)} kV. Zona de alta montaña colombiana.`
          : `δ = ${fmt(r.delta, 3)} y U₅₀ = ${fmt(r.u50, 1)} kV; busca 0,78–0,82.`,
      };
    },
  },
  notes: [
    'El exponente 0,75 es una aproximación; las normas de corrección dependen del tipo de ensayo y de la geometría.',
    'La humedad, la lluvia y la contaminación también modifican el comportamiento del aislamiento externo.',
    'No apliques el mismo factor de altitud al aislamiento interno de un equipo.',
  ],
};
