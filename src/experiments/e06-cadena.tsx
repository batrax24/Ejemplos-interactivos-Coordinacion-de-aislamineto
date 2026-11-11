import { fmt, roundUp } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene06 } from './scenes/s06';

interface Data {
  Um: number;
  kf: number;
  lfDisc: number;
  pitch: number;
  lfReq: number;
  nExact: number;
  n: number;
  lfReal: number;
  chainLength: number;
  creepMargin: number;
  leakagePerUm: number;
}

const compute = (p: Params): Data => {
  const lfReq = p.kf * p.Um;
  const nExact = lfReq / p.lfDisc;
  const n = roundUp(nExact);
  const lfReal = n * p.lfDisc;
  return {
    Um: p.Um,
    kf: p.kf,
    lfDisc: p.lfDisc,
    pitch: p.pitch,
    lfReq,
    nExact,
    n,
    lfReal,
    chainLength: n * p.pitch,
    creepMargin: (lfReal / lfReq - 1) * 100,
    leakagePerUm: lfReal / p.Um,
  };
};

export const exp06: ExperimentDef<Data> = {
  id: 'cadena',
  num: '06',
  title: 'Longitud de la cadena de aisladores',
  kicker: 'Distancia de fuga y número de discos',
  slides: 'Diapositivas 22 a 27',
  idea:
    'La distancia de fuga requerida crece con la tensión y con el criterio de contaminación. Al dividir por la fuga de un disco obtienes el número mínimo; siempre se redondea hacia arriba porque no existe medio aislador.',
  formulas: ['L_f = k_f · Uₘ', 'N_f = ⌈ L_f / L_disco ⌉', 'L_cadena ≈ N · paso'],
  live: (p) => {
    const r = compute(p);
    return [
      `L_f = ${fmt(p.kf, 1)} × ${fmt(p.Um, 1)} = ${fmt(r.lfReq, 0)} mm`,
      `N_f = ${fmt(r.lfReq, 0)} / ${fmt(p.lfDisc, 0)} = ${fmt(r.nExact, 2)} → ${r.n} discos`,
      `L_cadena = ${r.n} × ${fmt(p.pitch, 3)} = ${fmt(r.chainLength, 3)} m`,
    ];
  },
  params: [
    { id: 'Um', label: 'Tensión entre fases', symbol: 'Uₘ', unit: 'kV', min: 13.8, max: 800, step: 0.2, value: 245, decimals: 1 },
    {
      id: 'kf',
      label: 'Criterio de distancia de fuga',
      symbol: 'k_f',
      unit: 'mm/kV',
      min: 12,
      max: 45,
      step: 0.5,
      value: 25,
      decimals: 1,
      hint: '16 (ligera) · 20 (media) · 25 (fuerte) · 31+ (muy fuerte)',
    },
    { id: 'lfDisc', label: 'Fuga por disco', symbol: 'L_d', unit: 'mm/disco', min: 150, max: 550, step: 2, value: 292, decimals: 0 },
    { id: 'pitch', label: 'Paso entre discos', symbol: 'p', unit: 'm', min: 0.08, max: 0.25, step: 0.001, value: 0.146, decimals: 3 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Fuga requerida', symbol: 'L_f', value: fmt(r.lfReq, 0), unit: 'mm', tone: 'info' },
    { label: 'Cociente exacto', symbol: 'L_f/L_d', value: fmt(r.nExact, 2), tone: 'neutral' },
    { label: 'Discos necesarios', symbol: 'N', value: String(r.n), unit: 'unidades', tone: 'ok' },
    { label: 'Longitud de cadena', symbol: 'L_c', value: fmt(r.chainLength, 3), unit: 'm', tone: 'warn' },
  ],
  verdict: (r) => {
    if (r.chainLength > 8) return { tone: 'bad', text: 'Cadena de más de 8 m: revisa si el criterio de fuga es realista para la geometría.' };
    if (r.creepMargin > 15) return { tone: 'warn', text: 'Redondeaste con holgura; el exceso de fuga no compensa otras verificaciones.' };
    return { tone: 'ok', text: 'Cumple el criterio de fuga; aún faltan impulso, mecánica y ambiente.' };
  },
  Scene: Scene06,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let um = 10; um <= 800; um += 5) {
      pts.push([um, roundUp((data.kf * um) / data.lfDisc)]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 200, 400, 600, 800].map((u) => (
            <g key={u}>
              <line x1={54 + (u / 800) * 550} x2={54 + (u / 800) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (u / 800) * 550} y={214} textAnchor="middle" className="plot__tick">
                {u}
              </text>
            </g>
          ))}
          {[0, 20, 40, 60, 80].map((n) => (
            <g key={n}>
              <line x1={54} x2={604} y1={196 - (n / 80) * 176} y2={196 - (n / 80) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (n / 80) * 176} textAnchor="end" className="plot__tick">
                {n}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([u, n], i) => `${i ? 'L' : 'M'}${(54 + (u / 800) * 550).toFixed(1)},${(196 - Math.min(n, 80) / 80 * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.2"
          />
          <circle cx={54 + (data.Um / 800) * 550} cy={196 - (Math.min(data.n, 80) / 80) * 176} r={5} fill={C.amber} />
          <line x1={54 + (data.Um / 800) * 550} x2={54 + (data.Um / 800) * 550} y1={16} y2={196} stroke={C.amber} strokeDasharray="4 4" />
          <text x={54 + (data.Um / 800) * 550 + 8} y={196 - (Math.min(data.n, 80) / 80) * 176 - 8} className="plot__note" fill={C.amber}>
            {data.n} discos
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            Uₘ (kV entre fases)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            número de discos
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (245 kV, 25 mm/kV)', params: { Um: 245, kf: 25, lfDisc: 292, pitch: 0.146 } },
    { name: 'Zona muy contaminada', params: { kf: 35 } },
    { name: '115 kV, contaminación media', params: { Um: 115, kf: 20 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo: Uₘ = 245 kV, k_f = 25 mm/kV y 292 mm por disco → exactamente 21 discos.',
    hint: 'L_f = 6 125 mm; 6 125 / 292 = 20,98 → redondeando hacia arriba, 21.',
    goal: 'N = 21 discos',
    test: (p) => {
      const r = compute(p);
      const ok = r.n === 21 && Math.abs(p.Um - 245) < 0.3 && Math.abs(p.kf - 25) < 0.3 && Math.abs(p.lfDisc - 292) <= 1;
      return {
        pass: ok,
        detail: ok
          ? `N = ${r.n} discos y L_cadena = ${fmt(r.chainLength, 3)} m. Coincide con el ejemplo.`
          : `N = ${r.n} discos con los parámetros actuales; el ejemplo completo da 21.`,
      };
    },
  },
  notes: [
    'La cantidad exigida por un criterio (fuga) puede ser menor que la exigida por otro (impulso).',
    'Sin discos reales no hay cadena: 20,98 se convierte en 21, nunca en 20,98.',
    'El perfil del aislador importa tanto como el conteo: faldones sucios y húmedos cambian la ruta.',
  ],
};
