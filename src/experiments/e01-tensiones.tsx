import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene01 } from './scenes/s01';

interface Data {
  Um: number;
  UfRms: number;
  UfPeak: number;
  ratio: number;
  UmPick: number;
  UfPick: number;
  peakPick: number;
}

const compute = (p: Params): Data => {
  const Um = p.Um;
  const UfRms = Um / Math.sqrt(3);
  const UfPeak = (Math.SQRT2 * Um) / Math.sqrt(3);
  return {
    Um,
    UfRms,
    UfPeak,
    ratio: UfPeak / UfRms,
    UmPick: Um,
    UfPick: UfRms,
    peakPick: UfPeak,
  };
};

export const exp01: ExperimentDef<Data> = {
  id: 'tensiones',
  num: '01',
  title: 'De entre fases a fase–tierra',
  kicker: 'Magnitudes de tensión',
  slides: 'Diapositiva 06',
  idea:
    'Todo cálculo de aislamiento externo compara tensiones fase–tierra. La Uₘ de placa es entre fases y eficaz, así que hay que dividir por √3 y multiplicar por √2 para obtener la cresta que "ve" el aislamiento.',
  formulas: ['U_f = Uₘ / √3', 'Û_f = √2 · Uₘ / √3', 'Û_f / U_f = √2 ≈ 1,414'],
  live: (p) => {
    const r = compute(p);
    return [
      `U_f = ${fmt(p.Um, 1)} / √3 = ${fmt(r.UfRms, 2)} kV eficaces`,
      `Û_f = √2 × ${fmt(r.UfRms, 2)} = ${fmt(r.UfPeak, 2)} kV de cresta`,
    ];
  },
  params: [
    {
      id: 'Um',
      label: 'Tensión más elevada entre fases',
      symbol: 'Uₘ',
      unit: 'kV eficaces',
      min: 13.8,
      max: 800,
      step: 0.2,
      value: 245,
      decimals: 1,
      hint: 'Niveles típicos: 13,8 · 34,5 · 115 · 230 · 245 · 500 kV',
    },
  ],
  compute,
  readouts: (r) => [
    { label: 'Fase–tierra eficaz', symbol: 'U_f', value: fmt(r.UfRms, 2), unit: 'kV', tone: 'info' },
    { label: 'Fase–tierra cresta', symbol: 'Û_f', value: fmt(r.UfPeak, 2), unit: 'kV', tone: 'ok' },
    {
      label: 'Factor de cresta',
      symbol: 'Û/U',
      value: fmt(r.ratio, 3),
      tone: 'neutral',
      note: '√2 en régimen sinusoidal equilibrado',
    },
  ],
  Scene: Scene01,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 240; i++) {
      const deg = i * 2; // 0..480°
      const ph = (deg * Math.PI) / 180;
      pts.push([deg, data.UfPeak * Math.sin(ph)]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <defs>
            <linearGradient id="g01" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.cyan} stopOpacity="0.22" />
              <stop offset="100%" stopColor={C.cyan} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={48} x2={604} y1={20 + f * 180} y2={20 + f * 180} stroke="rgba(148,180,220,0.12)" />
          ))}
          <line x1={48} x2={604} y1={110} y2={110} stroke="rgba(148,180,220,0.35)" />
          <line x1={48} x2={48} y1={16} y2={204} stroke="rgba(148,180,220,0.35)" />
          {[0, 90, 180, 270, 360, 450].map((d) => (
            <text key={d} x={48 + (d / 480) * 556} y={222} textAnchor="middle" className="plot__tick">
              {d}°
            </text>
          ))}
          <path
            d={pts.map(([d, v], i) => `${i ? 'L' : 'M'}${(48 + (d / 480) * 556).toFixed(1)},${(110 - (v / data.UfPeak) * 88).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.4"
          />
          <line x1={48} x2={604} y1={110 - 88} y2={110 - 88} stroke={C.amber} strokeDasharray="5 4" />
          <text x={58} y={110 - 92} className="plot__note" fill={C.amber}>
            Û_f = {fmt(data.UfPeak, 1)} kV cresta
          </text>
          <line x1={48} x2={604} y1={110 - 62} y2={110 - 62} stroke={C.teal} strokeDasharray="5 4" />
          <text x={58} y={110 - 66} className="plot__note" fill={C.teal}>
            U_f = {fmt(data.UfRms, 1)} kV eficaz
          </text>
          <text x={326} y={236} textAnchor="middle" className="plot__axis">
            ángulo eléctrico (grados)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            tensión fase–tierra (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Distribución 13,8 kV', params: { Um: 13.8 } },
    { name: '245 kV (ejemplo del curso)', params: { Um: 245 } },
    { name: '500 kV', params: { Um: 500 } },
  ],
  challenge: {
    prompt: 'Ajusta Uₘ para que la tensión fase–tierra de cresta quede entre 190,0 y 205,0 kV de cresta.',
    hint: 'Despeja: Uₘ = Û_f × √3 / √2. Con 200 kV de cresta necesitas alrededor de 245 kV entre fases.',
    goal: '190 ≤ Û_f ≤ 205 kV',
    test: (p) => {
      const r = compute(p);
      const ok = r.UfPeak >= 190 && r.UfPeak <= 205;
      return {
        pass: ok,
        detail: ok
          ? `Û_f = ${fmt(r.UfPeak, 2)} kV de cresta. Justo la tensión del ejemplo del curso (200,04 kV).`
          : `Û_f = ${fmt(r.UfPeak, 2)} kV de cresta; necesitas entre 190 y 205.`,
      };
    },
  },
  notes: [
    'La conversión supone un sistema trifásico sinusoidal y equilibrado; una falla puede alterar las tensiones respecto a tierra.',
    'Nunca compares una tensión eficaz con una de cresta sin declarar la convención.',
  ],
};
