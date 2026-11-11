import { doubleExp, fmt, impulseTimes } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene03 } from './scenes/s03';

interface Data {
  front: number;
  tail: number;
  amplitude: number;
  t1: number;
  t2: number;
  tp: number;
  t0: number;
  label: string;
  wave: (t: number) => number;
  points: [number, number][];
  xMax: number;
}

const compute = (p: Params): Data => {
  const waveDef = doubleExp(p.front, p.tail);
  const times = impulseTimes(waveDef.norm, p.tail);
  const xMax = Math.min(p.tail * 5.5, 5000);
  const points: [number, number][] = [];
  for (let i = 0; i <= 420; i++) {
    const tt = (i / 420) * Math.min(p.tail * 7, 6000);
    points.push([tt, waveDef.norm(tt) * p.amplitude]);
  }
  return {
    front: p.front,
    tail: p.tail,
    amplitude: p.amplitude,
    t1: times.t1,
    t2: times.t2,
    tp: times.tp,
    t0: times.t0,
    label: `${fmt(times.t1, 1)}/${fmt(times.t2, 0)} µs`,
    wave: (tt) => waveDef.norm(tt) * p.amplitude,
    points,
    xMax,
  };
};

export const exp03: ExperimentDef<Data> = {
  id: 'impulso',
  num: '03',
  title: 'Forma de onda normalizada',
  kicker: 'Ensayo de impulso',
  slides: 'Diapositivas 08 y 09',
  idea:
    'Un impulso tipo rayo se describe como 1,2/50 µs: tiempo virtual de frente y tiempo hasta la semiamplitud en la cola. Cambiar esos tiempos cambia el esfuerzo real sobre el aislamiento, aunque la cresta sea la misma.',
  formulas: [
    'v(t) = A (e^(−t/τ₂) − e^(−t/τ₁))',
    't₁ = 1,67 (t₉₀ − t₃₀)',
    'Rayo: 1,2/50 µs · Maniobra: 170/2500 µs',
  ],
  live: (p) => {
    const r = compute(p);
    return [
      `τ₁ = ${fmt(p.front, 2)} µs · τ₂ = ${fmt(p.tail, 0)} µs`,
      `Frente virtual: 1,67 × (t₉₀ − t₃₀) = ${fmt(r.t1, 2)} µs`,
      `Cresta a los ${fmt(r.tp, 1)} µs · semiamplitud a los ${fmt(r.t2, 1)} µs`,
    ];
  },
  params: [
    {
      id: 'front',
      label: 'Constante de frente',
      symbol: 'τ₁',
      unit: 'µs',
      min: 0.1,
      max: 120,
      step: 0.01,
      value: 0.41,
      decimals: 2,
      hint: 'Valor del ejemplo: 0,41 µs → frente virtual ≈ 1,2 µs',
    },
    {
      id: 'tail',
      label: 'Constante de cola',
      symbol: 'τ₂',
      unit: 'µs',
      min: 10,
      max: 4000,
      step: 1,
      value: 66,
      decimals: 0,
      hint: 'Valor del ejemplo: 66 µs → semiamplitud ≈ 50 µs',
    },
    {
      id: 'amplitude',
      label: 'Amplitud de cresta',
      symbol: 'Â',
      unit: 'kV',
      min: 50,
      max: 2400,
      step: 5,
      value: 1050,
      decimals: 0,
    },
  ],
  compute,
  readouts: (r) => [
    {
      label: 'Tiempo virtual de frente',
      symbol: 't₁',
      value: fmt(r.t1, 2),
      unit: 'µs',
      tone: Math.abs(r.t1 - 1.2) < 0.25 ? 'ok' : r.t1 < 20 ? 'warn' : 'bad',
    },
    {
      label: 'Semiamplitud',
      symbol: 't₂',
      value: fmt(r.t2, 1),
      unit: 'µs',
      tone: Math.abs(r.t2 - 50) < 6 ? 'ok' : 'warn',
    },
    { label: 'Forma resultante', symbol: 't₁/t₂', value: r.label, unit: 'µs', tone: 'info' },
    { label: 'Instante de cresta', symbol: 't_p', value: fmt(r.tp, 1), unit: 'µs', tone: 'neutral' },
  ],
  verdict: (r) => {
    if (r.t1 > 20) return { tone: 'warn', text: 'Frente muy lento: el perfil se parece más a una maniobra que a un rayo.' };
    if (r.t2 > 1200) return { tone: 'warn', text: 'Cola muy larga: es la zona de impulsos de maniobra, no de rayo.' };
    return { tone: 'ok', text: 'Perfil utilizable para ilustrar ensayos de impulso.' };
  },
  Scene: Scene03,
  Plot: ({ data }) => {
    const xMax = data.xMax;
    let peak = 0;
    for (const [, v] of data.points) peak = Math.max(peak, v);
    const sx = (x: number) => 56 + (x / xMax) * 548;
    const sy = (v: number) => 196 - (v / (peak * 1.08 || 1)) * 176;
    const halfLevel = peak * 0.5;
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={56} x2={604} y1={20 + f * 176} y2={20 + f * 176} stroke="rgba(148,180,220,0.1)" />
          ))}
          <line x1={56} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={56} x2={56} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          <path
            d={data.points
              .filter(([x]) => x <= xMax)
              .map(([x, v], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(v).toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke={C.amber}
            strokeWidth="2.2"
          />
          <line
            x1={sx(Math.max(0, data.t0))}
            x2={sx(Math.max(0, data.t0 + data.t1 * 1.7))}
            y1={sy(peak * 0.3)}
            y2={sy(peak * 0.9)}
            stroke={C.cyan}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <text x={sx(Math.max(0, data.t0)) + 6} y={sy(peak * 0.22)} className="plot__note" fill={C.cyan}>
            frente t₁ = {fmt(data.t1, 2)} µs
          </text>
          <line x1={56} x2={604} y1={sy(halfLevel)} y2={sy(halfLevel)} stroke={C.violet} strokeDasharray="3 4" opacity="0.8" />
          <line x1={sx(data.t2)} x2={sx(data.t2)} y1={196} y2={sy(halfLevel)} stroke={C.violet} strokeDasharray="4 4" />
          <text x={sx(data.t2) + 6} y={sy(peak * 0.34)} className="plot__note" fill={C.violet}>
            t₂ = {fmt(data.t2, 0)} µs
          </text>
          <text x={58} y={sy(peak) + 2} className="plot__note" fill={C.amber}>
            {data.label} µs · {fmt(data.amplitude, 0)} kV
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            tiempo (µs)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            tensión (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Impulso rayo 1,2/50 µs', params: { front: 0.41, tail: 66, amplitude: 1050 } },
    { name: 'Impulso de maniobra', params: { front: 60, tail: 2400, amplitude: 850 } },
    { name: 'Frente muy rápido', params: { front: 0.12, tail: 40, amplitude: 1050 } },
  ],
  challenge: {
    prompt: 'Ajusta τ₁ y τ₂ hasta obtener una onda de rayo normalizada: t₁ entre 1,0 y 1,4 µs y t₂ entre 44 y 56 µs.',
    hint: 'Con τ₁ ≈ 0,41 µs y τ₂ ≈ 66 µs obtienes t₁ ≈ 1,2 µs y t₂ ≈ 50 µs. El frente virtual depende de t₉₀ − t₃₀, no de τ₁ directamente.',
    goal: '1,0 ≤ t₁ ≤ 1,4 µs · 44 ≤ t₂ ≤ 56 µs',
    test: (p) => {
      const r = compute(p);
      const ok = r.t1 >= 1 && r.t1 <= 1.4 && r.t2 >= 44 && r.t2 <= 56;
      return {
        pass: ok,
        detail: ok
          ? `Onda ${fmt(r.t1, 2)}/${fmt(r.t2, 1)} µs: la forma normalizada de rayo del material.`
          : `Obtuviste ${fmt(r.t1, 2)}/${fmt(r.t2, 1)} µs; la meta es ≈ 1,2/50 µs.`,
      };
    },
  },
  notes: [
    'La onda 8/20 µs es de corriente y caracteriza descargadores; no debe confundirse con la 1,2/50 µs de tensión.',
    'IEC 60060-1:2025 cambió la definición del tiempo de frente del impulso de maniobra (170/2500 µs).',
    'En textos anteriores el impulso de maniobra aparece como 250/2500 µs: ambos primeros números usan definiciones distintas.',
  ],
};
