import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene08 } from './scenes/s08';

interface Data {
  K: number;
  F: number;
  L: number;
  Vn: number;
  term1: number;
  term2: number;
  D: number;
  volumeFactor: number;
}

const compute = (p: Params): Data => {
  const term1 = p.K * Math.sqrt(Math.max(0, p.F + p.L));
  const term2 = p.Vn / 150;
  const D = term1 + term2;
  return {
    K: p.K,
    F: p.F,
    L: p.L,
    Vn: p.Vn,
    term1,
    term2,
    D,
    volumeFactor: (D * D) / (4.02 * 4.02),
  };
};

export const exp08: ExperimentDef<Data> = {
  id: 'separacion',
  num: '08',
  title: 'Separación preliminar entre fases',
  kicker: 'Predimensionamiento geométrico',
  slides: 'Diapositivas 31 y 32',
  idea:
    'Expresión histórica de predimensionamiento: la separación crece con la raíz de la flecha y la cadena, más un término lineal con la tensión. No reemplaza el diseño normativo, pero muestra qué variable pesa más.',
  formulas: ['D ≈ K √(F + L) + Vₙ / 150', 'K = 0,75 (ejemplo histórico)', 'D en metros'],
  live: (p) => {
    const r = compute(p);
    return [
      `D = ${fmt(p.K, 2)} √(${fmt(p.F, 1)} + ${fmt(p.L, 2)}) + ${fmt(p.Vn, 0)} / 150`,
      `D = ${fmt(r.term1, 2)} + ${fmt(r.term2, 2)} = ${fmt(r.D, 2)} m`,
    ];
  },
  params: [
    { id: 'K', label: 'Coeficiente empírico', symbol: 'K', unit: '—', min: 0.4, max: 1.2, step: 0.01, value: 0.75, decimals: 2 },
    { id: 'F', label: 'Flecha máxima', symbol: 'F', unit: 'm', min: 2, max: 20, step: 0.1, value: 8, decimals: 1 },
    { id: 'L', label: 'Longitud de cadena', symbol: 'L', unit: 'm', min: 0.5, max: 8, step: 0.01, value: 3, decimals: 2 },
    { id: 'Vn', label: 'Tensión nominal entre fases', symbol: 'Vₙ', unit: 'kV', min: 13.8, max: 800, step: 0.2, value: 230, decimals: 1 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Término geométrico', value: fmt(r.term1, 2), unit: 'm', tone: 'info' },
    { label: 'Término eléctrico', value: fmt(r.term2, 2), unit: 'm', tone: 'info' },
    { label: 'Separación preliminar', symbol: 'D', value: fmt(r.D, 2), unit: 'm', tone: 'ok' },
    {
      label: 'Peso relativo del término eléctrico',
      value: fmt((r.term2 / r.D) * 100, 1),
      unit: '%',
      tone: r.term2 / r.D > 0.5 ? 'warn' : 'neutral',
    },
  ],
  verdict: (r) => {
    if (r.D < 1.5) return { tone: 'warn', text: 'D bajo 1,5 m: revisa si el resultado es físicamente plausible para tu nivel de tensión.' };
    if (r.term2 / r.D > 0.55) return { tone: 'info', text: 'A esta tensión, el término eléctrico domina la separación.' };
    return { tone: 'ok', text: 'La geometría (flecha y cadena) domina la separación preliminar.' };
  },
  Scene: Scene08,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let v = 13.8; v <= 800; v += 5) {
      pts.push([v, data.K * Math.sqrt(data.F + data.L) + v / 150]);
    }
    const ptsF: [number, number][] = [];
    for (let v = 13.8; v <= 800; v += 5) {
      ptsF.push([v, v / 150]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 200, 400, 600, 800].map((v) => (
            <g key={v}>
              <line x1={54 + (v / 800) * 550} x2={54 + (v / 800) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (v / 800) * 550} y={214} textAnchor="middle" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          {[0, 2, 4, 6, 8].map((d) => (
            <g key={d}>
              <line x1={54} x2={604} y1={196 - (d / 8) * 176} y2={196 - (d / 8) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (d / 8) * 176} textAnchor="end" className="plot__tick">
                {d}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([v, d], i) => `${i ? 'L' : 'M'}${(54 + (v / 800) * 550).toFixed(1)},${(196 - (Math.min(d, 8) / 8) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.2"
          />
          <path
            d={ptsF.map(([v, d], i) => `${i ? 'L' : 'M'}${(54 + (v / 800) * 550).toFixed(1)},${(196 - (Math.min(d, 8) / 8) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.violet}
            strokeWidth="1.4"
            strokeDasharray="5 4"
          />
          <circle cx={54 + (data.Vn / 800) * 550} cy={196 - (Math.min(data.D, 8) / 8) * 176} r={5} fill={C.amber} />
          <text x={54 + (data.Vn / 800) * 550 + 8} y={196 - (Math.min(data.D, 8) / 8) * 176 - 8} className="plot__note" fill={C.amber}>
            D = {fmt(data.D, 2)} m
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            tensión nominal (kV)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            separación D (m)
          </text>
        </svg>
        <div className="plotlegend">
          <span>
            <i style={{ background: C.cyan }} />
            D total
          </span>
          <span>
            <i style={{ background: C.violet }} />
            término eléctrico Vₙ/150
          </span>
        </div>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (230 kV, 8 m, 3 m)', params: { K: 0.75, F: 8, L: 3, Vn: 230 } },
    { name: 'Vano largo (F = 14 m)', params: { F: 14 } },
    { name: '500 kV', params: { Vn: 500 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo histórico: K = 0,75, F = 8 m, L = 3 m y Vₙ = 230 kV → D ≈ 4,02 m.',
    hint: '0,75·√11 = 2,49 m y 230/150 = 1,53 m; la suma da 4,02 m.',
    goal: 'D ≈ 4,02 m',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.D - 4.02) <= 0.03;
      return {
        pass: ok,
        detail: ok
          ? `D = ${fmt(r.D, 2)} m. Coincide con el ejemplo del curso.`
          : `D = ${fmt(r.D, 2)} m; el ejemplo busca ≈ 4,02 m.`,
      };
    },
  },
  notes: [
    'El resultado es preliminar: la separación real se verifica con sobretensiones fase–fase y posiciones bajo viento.',
    'La temperatura del conductor cambia la flecha F y, por tanto, la separación.',
    'No todas las líneas usan esta expresión; consúltala con la norma aplicable al proyecto.',
  ],
};
