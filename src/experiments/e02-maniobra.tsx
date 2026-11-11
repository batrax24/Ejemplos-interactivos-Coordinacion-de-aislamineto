import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene02 } from './scenes/s02';

interface Data {
  Um: number;
  Fv: number;
  factor: number;
  UfPeak: number;
  Us: number;
  UsReq: number;
  margin: number;
  safety: number;
  tPeak: number;
}

const compute = (p: Params): Data => {
  const UfPeak = (p.Um * Math.SQRT2) / Math.sqrt(3);
  const Us = p.Fv * UfPeak;
  const UsReq = p.factor * Us;
  const margin = (p.factor - 1) * 100;
  const safety = UsReq / UfPeak - p.Fv;
  return {
    Um: p.Um,
    Fv: p.Fv,
    factor: p.factor,
    UfPeak,
    Us,
    UsReq,
    margin,
    safety,
    tPeak: 250,
  };
};

export const exp02: ExperimentDef<Data> = {
  id: 'maniobra',
  num: '02',
  title: 'Sobretensión de maniobra en p.u.',
  kicker: 'Esfuerzo de frente lento',
  slides: 'Diapositiva 07',
  idea:
    'La sobretensión de maniobra se expresa como un factor en por unidad de la cresta fase–tierra. Ese factor multiplica la tensión base del sistema; el resultado se compara contra la tensión soportada de maniobra.',
  formulas: ['Û_f = √(2/3) · Uₘ', 'U_maniobra = Fᵥ · Û_f', 'U_soporte = 1,15 · U_maniobra'],
  live: (p) => {
    const r = compute(p);
    return [
      `Û_f = √(2/3) × ${fmt(p.Um, 1)} = ${fmt(r.UfPeak, 2)} kV cresta`,
      `U_man = ${fmt(p.Fv, 2)} × ${fmt(r.UfPeak, 2)} = ${fmt(r.Us, 2)} kV cresta`,
      `U_soporte = ${fmt(p.factor, 2)} × ${fmt(r.Us, 2)} = ${fmt(r.UsReq, 2)} kV`,
    ];
  },
  params: [
    { id: 'Um', label: 'Tensión entre fases', symbol: 'Uₘ', unit: 'kV eficaces', min: 13.8, max: 800, step: 0.2, value: 245, decimals: 1 },
    {
      id: 'Fv',
      label: 'Factor de sobretensión de maniobra',
      symbol: 'Fᵥ',
      unit: 'p.u.',
      min: 1,
      max: 4,
      step: 0.05,
      value: 2.5,
      decimals: 2,
      hint: 'El ejemplo del curso usa 2,5 p.u. (supuesto didáctico).',
    },
    {
      id: 'factor',
      label: 'Margen aplicado a la tensión soportada',
      symbol: 'k',
      unit: '×',
      min: 1,
      max: 1.6,
      step: 0.01,
      value: 1.15,
      decimals: 2,
      hint: 'El 1,15 pertenece a este ejemplo; no es un margen universal.',
    },
  ],
  compute,
  readouts: (r) => [
    { label: 'Cresta fase–tierra', symbol: 'Û_f', value: fmt(r.UfPeak, 2), unit: 'kV', tone: 'info' },
    { label: 'Sobretensión de maniobra', symbol: 'U_man', value: fmt(r.Us, 2), unit: 'kV', tone: 'warn' },
    { label: 'Soporte requerido', symbol: 'U_sop', value: fmt(r.UsReq, 2), unit: 'kV', tone: 'ok' },
    {
      label: 'Margen sobre la cresta nominal',
      symbol: 'k−1',
      value: fmt(r.margin, 1),
      unit: '%',
      tone: r.margin > 20 ? 'ok' : r.margin > 10 ? 'warn' : 'bad',
    },
  ],
  verdict: (r) => {
    if (r.safety > 1.5) return { tone: 'bad', text: 'El soporte requerido es casi el doble de la cresta nominal: revisa el factor.' };
    if (r.Fv > 3) return { tone: 'warn', text: 'Factores de 3 p.u. o más son altos para maniobra convencional.' };
    return { tone: 'ok', text: 'Relación razonable para una línea de transmisión típica.' };
  },
  Scene: Scene02,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 300; i++) {
      const tt = (i / 300) * 3;
      const f = 1 - Math.exp(-tt / 0.12);
      const osc = f * (1 + 0.32 * Math.sin(tt * 17) * Math.exp(-tt * 0.9));
      pts.push([tt, data.UfPeak * data.Fv * osc]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <defs>
            <linearGradient id="g02" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.orange} stopOpacity="0.24" />
              <stop offset="100%" stopColor={C.orange} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f, i) => (
            <line key={i} x1={52} x2={604} y1={20 + f * 176} y2={20 + f * 176} stroke="rgba(148,180,220,0.1)" />
          ))}
          <line x1={52} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={52} x2={52} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          <path
            d={pts.map(([x, v], i) => `${i ? 'L' : 'M'}${(52 + (x / 3) * 552).toFixed(1)},${(196 - (v / (data.UsReq * 1.05)) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.orange}
            strokeWidth="2.2"
          />
          <line x1={52} x2={604} y1={196 - (data.Us / (data.UsReq * 1.05)) * 176} y2={196 - (data.Us / (data.UsReq * 1.05)) * 176} stroke={C.amber} strokeDasharray="5 4" />
          <text x={60} y={196 - (data.Us / (data.UsReq * 1.05)) * 176 - 6} className="plot__note" fill={C.amber}>
            U_man = {fmt(data.Us, 1)} kV
          </text>
          <line x1={52} x2={604} y1={196 - (data.UfPeak / (data.UsReq * 1.05)) * 176} y2={196 - (data.UfPeak / (data.UsReq * 1.05)) * 176} stroke={C.teal} strokeDasharray="5 4" />
          <text x={60} y={196 - (data.UfPeak / (data.UsReq * 1.05)) * 176 - 6} className="plot__note" fill={C.teal}>
            Û_f = {fmt(data.UfPeak, 1)} kV
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            tiempo (ms, escalado)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            tensión fase–tierra (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (245 kV, 2,5 p.u.)', params: { Um: 245, Fv: 2.5, factor: 1.15 } },
    { name: 'Maniobra suave (1,8 p.u.)', params: { Fv: 1.8 } },
    { name: 'Recierre con atrapamiento (3,2 p.u.)', params: { Fv: 3.2 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo: Uₘ = 245 kV, Fᵥ = 2,5 p.u. y k = 1,15 → U_soporte ≈ 575,1 kV.',
    hint: 'Deja Uₘ en 245 kV, pon Fᵥ en 2,50 y el margen en 1,15. La soporte debe quedar entre 573 y 577 kV.',
    goal: 'U_sop ≈ 575 kV',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.UsReq - 575.1) <= 2;
      return {
        pass: ok,
        detail: ok
          ? `U_sop = ${fmt(r.UsReq, 1)} kV. Coincide con el ejemplo del curso.`
          : `U_sop = ${fmt(r.UsReq, 1)} kV; el ejemplo busca ≈ 575,1 kV.`,
      };
    },
  },
  notes: [
    'El factor de sobretensión depende del tipo de maniobra, la longitud de línea y la compensación.',
    'La tensión soportada se compara con el mismo tipo de onda y la misma configuración (fase–tierra).',
  ],
};
