import { fmt, sci } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene13 } from './scenes/s13';

interface Data {
  f: number;
  delta: number;
  r: number;
  s: number;
  U: number;
  U0: number;
  root: number;
  diff: number;
  P: number;
  gradient: number;
  surfaceField: number;
  bundleEq: number;
  critical: number;
  active: boolean;
}

const compute = (p: Params): Data => {
  const diff = Math.max(0, p.U - p.U0);
  const root = Math.sqrt(p.r / p.s);
  const Pc = (242 / p.delta) * (p.f + 25) * root * diff * diff * 1e-5;
  const gradient = p.U / Math.log(Math.max(1.5, 100 / p.r));
  const bundleEq = Math.sqrt(p.r * Math.max(1, p.bundle));
  return {
    f: p.f,
    delta: p.delta,
    r: p.r,
    s: p.s,
    U: p.U,
    U0: p.U0,
    root,
    diff,
    P: Pc,
    gradient,
    surfaceField: p.U / Math.max(0.4, Math.log(p.s / p.r)),
    bundleEq,
    critical: p.U0,
    active: p.U > p.U0,
  };
};

export const exp13: ExperimentDef<Data> = {
  id: 'corona',
  num: '13',
  title: 'Pérdidas por efecto corona',
  kicker: 'Fórmula de Peek',
  slides: 'Diapositivas 54 a 58',
  idea:
    'Sobre cierto umbral, el campo en la superficie del conductor ioniza el aire local y aparece el efecto corona. Peek describe las pérdidas en función del radio, la separación y la densidad del aire. Bajar el gradiente reduce esas pérdidas.',
  formulas: ['P_cor = (242/δ)(f+25) √(r/s)(U−U₀)² ×10⁻⁵', 'P en kW/km por conductor', 'U > U₀ para que aparezca'],
  live: (p) => {
    const r = compute(p);
    return [
      `√(r/s) = √(${fmt(p.r, 2)} / ${fmt(p.s, 0)}) = ${fmt(r.root, 4)}`,
      `(U − U₀)² = (${fmt(p.U, 0)} − ${fmt(p.U0, 0)})² = ${fmt(r.diff * r.diff, 1)}`,
      `P_cor = (242/${fmt(p.delta, 2)}) × ${fmt(p.f + 25, 0)} × ${fmt(r.root, 4)} × ${fmt(r.diff * r.diff, 1)} × 10⁻⁵ = ${fmt(r.P, 2)} kW/km`,
    ];
  },
  params: [
    { id: 'f', label: 'Frecuencia', symbol: 'f', unit: 'Hz', min: 50, max: 60, step: 10, value: 60, decimals: 0 },
    { id: 'delta', label: 'Densidad relativa del aire', symbol: 'δ', unit: '—', min: 0.6, max: 1.05, step: 0.01, value: 0.9, decimals: 2 },
    { id: 'r', label: 'Radio del conductor', symbol: 'r', unit: 'cm', min: 0.3, max: 4, step: 0.05, value: 1.5, decimals: 2 },
    { id: 's', label: 'Separación entre fases', symbol: 's', unit: 'cm', min: 200, max: 1500, step: 10, value: 600, decimals: 0 },
    { id: 'U', label: 'Tensión aplicada', symbol: 'U', unit: 'kV eficaces', min: 50, max: 500, step: 1, value: 150, decimals: 0 },
    { id: 'U0', label: 'Tensión disruptiva visual', symbol: 'U₀', unit: 'kV eficaces', min: 60, max: 400, step: 1, value: 120, decimals: 0 },
    { id: 'bundle', label: 'Subconductores por fase (comparación)', unit: 'unidades', min: 1, max: 4, step: 1, value: 1, decimals: 0, hint: 'Solo ilustrativo del haz: no entra en la fórmula de Peek.' },
  ],
  compute,
  readouts: (r) => [
    { label: 'Diferencia sobre el umbral', symbol: 'U−U₀', value: fmt(r.diff, 0), unit: 'kV', tone: r.active ? 'warn' : 'ok' },
    { label: 'Pérdidas por corona', symbol: 'P_cor', value: fmt(r.P, 2), unit: 'kW/km', tone: r.P > 12 ? 'bad' : r.P > 3 ? 'warn' : 'ok' },
    { label: 'Gradiente de superficie (aprox.)', value: fmt(r.surfaceField, 1), unit: 'kV/cm', tone: r.surfaceField > 20 ? 'bad' : 'ok' },
    { label: 'Radio equivalente del haz', value: fmt(r.bundleEq, 2), unit: 'cm', tone: 'neutral', note: 'Solo referencia cualitativa' },
  ],
  verdict: (r) => {
    if (!r.active) return { tone: 'ok', text: 'Tensión bajo el umbral: en el modelo de Peek no hay pérdidas de corona.' };
    if (r.P > 15) return { tone: 'bad', text: 'Pérdidas altas: considera conductor de mayor radio o haz de subconductores.' };
    if (r.P > 5) return { tone: 'warn', text: 'Corona apreciable: revisa gradiente superficial y ruido audible.' };
    return { tone: 'ok', text: 'Pérdidas moderadas para las hipótesis de Peek.' };
  },
  Scene: Scene13,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let u = 50; u <= 500; u += 5) {
      const diff = Math.max(0, u - data.U0);
      pts.push([u, (242 / data.delta) * (data.f + 25) * Math.sqrt(data.r / data.s) * diff * diff * 1e-5]);
    }
    const maxP = Math.max(1, ...pts.map((p) => p[1]));
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[50, 150, 250, 350, 450].map((u) => (
            <g key={u}>
              <line x1={54 + ((u - 50) / 450) * 550} x2={54 + ((u - 50) / 450) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + ((u - 50) / 450) * 550} y={214} textAnchor="middle" className="plot__tick">
                {u}
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={54} x2={604} y1={196 - f * 176} y2={196 - f * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - f * 176} textAnchor="end" className="plot__tick">
                {fmt(maxP * f, 1)}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([u, p], i) => `${i ? 'L' : 'M'}${(54 + ((u - 50) / 450) * 550).toFixed(1)},${(196 - (Math.min(p, maxP) / maxP) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.orange}
            strokeWidth="2.3"
          />
          <line x1={54 + ((data.U0 - 50) / 450) * 550} x2={54 + ((data.U0 - 50) / 450) * 550} y1={16} y2={196} stroke={C.red} strokeDasharray="5 4" />
          <text x={54 + ((data.U0 - 50) / 450) * 550 + 6} y={30} className="plot__note" fill={C.red}>
            U₀ = {fmt(data.U0, 0)} kV
          </text>
          <circle
            cx={54 + ((data.U - 50) / 450) * 550}
            cy={196 - (Math.min(data.P, maxP) / maxP) * 176}
            r={5}
            fill={C.amber}
          />
          <text x={54 + ((data.U - 50) / 450) * 550 + 8} y={196 - (Math.min(data.P, maxP) / maxP) * 176 - 8} className="plot__note" fill={C.amber}>
            {fmt(data.P, 2)} kW/km
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            tensión aplicada (kV eficaces)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            pérdidas (kW/km)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (150 kV, δ 0,90)', params: { f: 60, delta: 0.9, r: 1.5, s: 600, U: 150, U0: 120 } },
    { name: 'Conductor grueso (r = 3 cm)', params: { r: 3 } },
    { name: 'Debajo del umbral', params: { U: 110 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo del curso: f = 60 Hz, δ = 0,90, r = 1,5 cm, s = 600 cm, U = 150 kV y U₀ = 120 kV → P ≈ 10,29 kW/km.',
    hint: '√(1,5/600) = 0,05; (150−120)² = 900. Sustituye y obtienes 10,29 kW/km.',
    goal: 'P_cor ≈ 10,3 kW/km',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.P - 10.29) <= 0.3;
      return {
        pass: ok,
        detail: ok
          ? `P_cor = ${fmt(r.P, 2)} kW/km (${sci(r.P, 1)} W/m). Coincide con el ejemplo.`
          : `P_cor = ${fmt(r.P, 2)} kW/km; el ejemplo busca ≈ 10,29.`,
      };
    },
  },
  notes: [
    'Peek es empírica y para buen tiempo: no es una ley universal.',
    'La corona produce ruido audible, luz y radiointerferencia además de pérdidas.',
    'Un haz de subconductores reduce el gradiente superficial efectivo sin aumentar el peso del cobre.',
  ],
};
