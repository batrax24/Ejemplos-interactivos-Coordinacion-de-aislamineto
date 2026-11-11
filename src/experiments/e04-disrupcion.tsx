import { fmt, normalCdf, normalPdf, normalQuantile } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene04 } from './scenes/s04';

interface Data {
  u50: number;
  sigmaPct: number;
  sigma: number;
  pTarget: number;
  z: number;
  uP: number;
  points: [number, number][];
  cdf: [number, number][];
  pAtU50: number;
}

const compute = (p: Params): Data => {
  const sigma = (p.sigmaPct / 100) * p.u50;
  const z = normalQuantile(p.pTarget / 100);
  const uP = p.u50 + z * sigma;
  const points: [number, number][] = [];
  const cdf: [number, number][] = [];
  for (let i = 0; i <= 200; i++) {
    const u = p.u50 - 3.6 * sigma + (i / 200) * 7.2 * sigma;
    points.push([u, normalPdf((u - p.u50) / sigma)]);
    cdf.push([u, normalCdf((u - p.u50) / sigma)]);
  }
  return {
    u50: p.u50,
    sigmaPct: p.sigmaPct,
    sigma,
    pTarget: p.pTarget,
    z,
    uP,
    points,
    cdf,
    pAtU50: 50,
  };
};

export const exp04: ExperimentDef<Data> = {
  id: 'disrupcion',
  num: '04',
  title: 'Probabilidad de disrupción',
  kicker: 'U₅₀, dispersión y cuantiles',
  slides: 'Diapositivas 18 y 19',
  idea:
    'La tensión disruptiva no es un número único: se distribuye. Con U₅₀ y una desviación estándar puedes calcular la tensión que produce una probabilidad de disrupción dada, y ver cuánto separa esa tensión de la cresta que creías segura.',
  formulas: ['U_p = U₅₀ + z_p · σ', 'σ = (s/100) · U₅₀', 'U₁₀ = 700 − 1,282 × 42 = 646,2 kV'],
  live: (p) => {
    const r = compute(p);
    return [
      `σ = (${fmt(p.sigmaPct, 1)} / 100) × ${fmt(p.u50, 1)} = ${fmt(r.sigma, 2)} kV`,
      `z(${fmt(p.pTarget, 0)} %) = ${fmt(r.z, 3)}`,
      `U_${fmt(p.pTarget, 0)} = ${fmt(p.u50, 1)} ${r.z >= 0 ? '+' : '−'} ${fmt(Math.abs(r.z * r.sigma), 2)} = ${fmt(r.uP, 2)} kV`,
    ];
  },
  params: [
    { id: 'u50', label: 'Tensión al 50 % de disrupción', symbol: 'U₅₀', unit: 'kV cresta', min: 100, max: 2000, step: 5, value: 700, decimals: 0 },
    { id: 'sigmaPct', label: 'Desviación estándar relativa', symbol: 's', unit: '% de U₅₀', min: 1, max: 15, step: 0.1, value: 6, decimals: 1 },
    { id: 'pTarget', label: 'Probabilidad de disrupción objetivo', symbol: 'P', unit: '%', min: 1, max: 50, step: 1, value: 10, decimals: 0 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Desviación estándar', symbol: 'σ', value: fmt(r.sigma, 2), unit: 'kV', tone: 'info' },
    { label: 'Cuantil normal', symbol: 'z', value: fmt(r.z, 3), tone: 'neutral' },
    { label: `Tensión al ${fmt(r.pTarget, 0)} %`, symbol: `U${fmt(r.pTarget, 0)}`, value: fmt(r.uP, 2), unit: 'kV cresta', tone: 'warn' },
    { label: 'Probabilidad con U₅₀', value: '50,0', unit: '%', tone: 'bad', note: 'Aplicar U₅₀ implica fallar la mitad de las veces.' },
  ],
  verdict: (r) => {
    if (r.sigmaPct > 10) return { tone: 'warn', text: 'Dispersión alta: pequeñas variaciones de tensión cambian mucho la probabilidad.' };
    if (r.pTarget > 30) return { tone: 'warn', text: 'Un objetivo de 30 % o más es un criterio de diseño muy permisivo.' };
    return { tone: 'ok', text: 'Dispersión y objetivo compatibles con los ejemplos del curso.' };
  },
  Scene: Scene04,
  Plot: ({ data }) => {
    const lo = data.u50 - 3.6 * data.sigma;
    const hi = data.u50 + 3.6 * data.sigma;
    const sx = (u: number) => 54 + ((u - lo) / (hi - lo)) * 548;
    const peakPdf = Math.max(...data.points.map((p) => p[1]));
    const sy = (v: number) => 196 - (v / (peakPdf * 1.15)) * 168;
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <defs>
            <linearGradient id="g04" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.violet} stopOpacity="0.35" />
              <stop offset="100%" stopColor={C.violet} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          <path
            d={`${data.points
              .filter(([u]) => u <= data.uP)
              .map(([u, v], i) => `${i ? 'L' : 'M'}${sx(u).toFixed(1)},${sy(v).toFixed(1)}`)
              .join(' ')} L${sx(data.uP).toFixed(1)},196 L${sx(lo).toFixed(1)},196 Z`}
            fill="url(#g04)"
          />
          <path
            d={data.points.map(([u, v], i) => `${i ? 'L' : 'M'}${sx(u).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.violet}
            strokeWidth="2"
          />
          <path
            d={data.cdf.map(([u, p], i) => `${i ? 'L' : 'M'}${sx(u).toFixed(1)},${196 - p * 160}`).join(' ')}
            fill="none"
            stroke={C.teal}
            strokeWidth="1.6"
            strokeDasharray="6 4"
          />
          <line x1={sx(data.uP)} x2={sx(data.uP)} y1={196} y2={26} stroke={C.orange} strokeDasharray="4 4" />
          <text x={sx(data.uP) + 6} y={34} className="plot__note" fill={C.orange}>
            U{fmt(data.pTarget, 0)} = {fmt(data.uP, 1)} kV
          </text>
          <line x1={sx(data.u50)} x2={sx(data.u50)} y1={196} y2={26} stroke={C.cyan} strokeDasharray="4 4" />
          <text x={sx(data.u50) + 6} y={50} className="plot__note" fill={C.cyan}>
            U₅₀ = {fmt(data.u50, 0)} kV
          </text>
          <line x1={54} x2={604} y1={116} y2={116} stroke="rgba(148,180,220,0.2)" strokeDasharray="3 3" />
          <text x={58} y={112} className="plot__tick">
            50 % acumulado
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            tensión de cresta (kV)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            densidad / probabilidad
          </text>
        </svg>
        <div className="plotlegend">
          <span>
            <i style={{ background: C.violet }} />
            densidad normal
          </span>
          <span>
            <i style={{ background: C.teal }} />
            probabilidad acumulada
          </span>
        </div>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (700 kV, 6 %)', params: { u50: 700, sigmaPct: 6, pTarget: 10 } },
    { name: 'Aislamiento muy disperso (12 %)', params: { sigmaPct: 12 } },
    { name: 'Criterio exigente (2 %)', params: { pTarget: 2 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo: U₅₀ = 700 kV, s = 6 % y P = 10 % → U₁₀ debería dar 646,2 kV.',
    hint: 'Fija U₅₀ = 700, s = 6,0 y P = 10. σ = 42 kV y z = −1,282.',
    goal: 'U₁₀ = 646,2 kV',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.uP - 646.2) <= 1.2;
      return {
        pass: ok,
        detail: ok
          ? `U₁₀ = ${fmt(r.uP, 2)} kV. El 10 % es un supuesto didáctico, no un criterio universal.`
          : `U₁₀ = ${fmt(r.uP, 2)} kV; el ejemplo espera 646,2 kV.`,
      };
    },
  },
  notes: [
    'U₅₀ (CFO) no es una tensión que el aislamiento soporte con 100 % de certeza.',
    'Un estudio completo combina la distribución del esfuerzo con la de la resistencia.',
    'La desviación típica del aire suele estar entre 3 % y 8 % según geometría y forma de onda.',
  ],
};
