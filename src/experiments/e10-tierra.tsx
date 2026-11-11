import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene10 } from './scenes/s10';

interface Data {
  current: number;
  Rt: number;
  L: number;
  diDt: number;
  Vr: number;
  Vl: number;
  Vt: number;
  V50kA: number;
  u50: number;
  flashover: boolean;
  margin: number;
}

const compute = (p: Params): Data => {
  const Vr = (p.current * 1000 * p.Rt) / 1000;
  const Vl = p.L * p.diDt;
  const Vt = Vr + Vl;
  const u50 = 700;
  return {
    current: p.current,
    Rt: p.Rt,
    L: p.L,
    diDt: p.diDt,
    Vr,
    Vl,
    Vt,
    V50kA: 50 * p.Rt,
    u50,
    flashover: Vt > u50,
    margin: (u50 / Vt - 1) * 100,
  };
};

export const exp10: ExperimentDef<Data> = {
  id: 'tierra',
  num: '10',
  title: 'Puesta a tierra y flameo inverso',
  kicker: 'Elevación de potencial de torre',
  slides: 'Diapositivas 37 a 41',
  idea:
    'El rayo que entra por la guarda eleva el potencial de la torre. Si ese potencial supera la capacidad de la cadena aparece el flameo inverso. Bajar la resistencia de tierra es la palanca más directa, pero la inductancia limita cuánto se gana.',
  formulas: ['V_t ≈ I · R_t', 'v(t) ≈ R·i(t) + L·di/dt', 'Flameo inverso si V_t > U_aislamiento'],
  live: (p) => {
    const r = compute(p);
    return [
      `V_R = ${fmt(p.current, 1)} kA × ${fmt(p.Rt, 1)} Ω = ${fmt(r.Vr, 1)} kV`,
      `V_L = ${fmt(p.L, 2)} µH × ${fmt(p.diDt, 1)} kA/µs = ${fmt(p.L * p.diDt, 1)} kV`,
      `V_t = ${fmt(r.Vr, 1)} + ${fmt(p.L * p.diDt, 1)} = ${fmt(r.Vt, 1)} kV  ${r.flashover ? '> 700 kV → flameo' : '< 700 kV → soporta'}`,
    ];
  },
  params: [
    { id: 'current', label: 'Corriente de rayo por la torre', symbol: 'I', unit: 'kA', min: 2, max: 80, step: 0.5, value: 10, decimals: 1 },
    { id: 'Rt', label: 'Resistencia de puesta a tierra', symbol: 'R_t', unit: 'Ω', min: 1, max: 60, step: 0.5, value: 15, decimals: 1 },
    { id: 'L', label: 'Inductancia equivalente de torre', symbol: 'L', unit: 'µH', min: 0, max: 20, step: 0.1, value: 1, decimals: 1 },
    { id: 'diDt', label: 'Pendiente de la corriente', symbol: 'di/dt', unit: 'kA/µs', min: 0, max: 30, step: 0.5, value: 10, decimals: 1 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Caída resistiva', symbol: 'I·R_t', value: fmt(r.Vr, 1), unit: 'kV', tone: 'info' },
    { label: 'Caída inductiva', symbol: 'L·di/dt', value: fmt(r.L * r.diDt, 1), unit: 'kV', tone: 'info' },
    { label: 'Potencial de torre', symbol: 'V_t', value: fmt(r.Vt, 1), unit: 'kV', tone: r.flashover ? 'bad' : r.Vt > 560 ? 'warn' : 'ok' },
    {
      label: 'Margen frente a la cadena',
      value: fmt(r.margin, 1),
      unit: '%',
      tone: r.margin > 25 ? 'ok' : r.margin > 0 ? 'warn' : 'bad',
    },
  ],
  verdict: (r) =>
    r.flashover
      ? { tone: 'bad', text: 'Flameo inverso: el potencial de torre supera la capacidad de la cadena (700 kV en este modelo).' }
      : { tone: 'ok', text: 'La cadena soporta el potencial de torre en este modelo concentrado R–L.' },
  Scene: Scene10,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 100; i++) {
      const rt = (i / 100) * 60;
      pts.push([rt, data.current * rt + (data.L * data.diDt) / 1000]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 10, 20, 30, 40, 50, 60].map((v) => (
            <g key={v}>
              <line x1={54 + (v / 60) * 550} x2={54 + (v / 60) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (v / 60) * 550} y={214} textAnchor="middle" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          {[0, 200, 400, 600, 800, 1000].map((v) => (
            <g key={v}>
              <line x1={54} x2={604} y1={196 - (v / 1000) * 176} y2={196 - (v / 1000) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (v / 1000) * 176} textAnchor="end" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          <line x1={54} x2={604} y1={196 - (700 / 1000) * 176} y2={196 - (700 / 1000) * 176} stroke={C.red} strokeDasharray="6 4" />
          <text x={604} y={196 - (700 / 1000) * 176 - 6} textAnchor="end" className="plot__note" fill={C.red}>
            U cadena 700 kV
          </text>
          <path
            d={pts.map(([r, v], i) => `${i ? 'L' : 'M'}${(54 + (r / 60) * 550).toFixed(1)},${(196 - (Math.min(v, 1000) / 1000) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.3"
          />
          <circle cx={54 + (data.Rt / 60) * 550} cy={196 - (Math.min(data.Vt, 1000) / 1000) * 176} r={5} fill={data.flashover ? C.red : C.teal} />
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            resistencia de tierra R_t (Ω), con I y L fijos
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            potencial de torre V_t (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (10 kA, 15 Ω)', params: { current: 10, Rt: 15, L: 0, diDt: 10 } },
    { name: 'Tierra mejorada (5 Ω)', params: { Rt: 5 } },
    { name: 'Rayo severo (40 kA)', params: { current: 40 } },
  ],
  challenge: {
    prompt: 'Elige una R_t que evite el flameo inverso con I = 20 kA, L = 1 µH y di/dt = 10 kA/µs.',
    hint: 'V_t = 20·R_t + 10 kV debe quedar bajo 700 kV → R_t < 34,5 Ω. Prueba valores entre 20 y 30 Ω.',
    goal: 'V_t < 700 kV con 20 kA',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(p.current - 20) < 0.3 && r.Vt < 700;
      return {
        pass: ok,
        detail: ok
          ? `V_t = ${fmt(r.Vt, 1)} kV con I = 20 kA y R_t = ${fmt(p.Rt, 1)} Ω: flameo evitado.`
          : `V_t = ${fmt(r.Vt, 1)} kV; se pide I = 20 kA y V_t < 700 kV.`,
      };
    },
  },
  notes: [
    'Un modelo R puro no incluye inductancia ni reparto de corriente: para diseño real se requiere respuesta impulsiva.',
    'La seguridad de personas depende de tensiones de paso y contacto, no solo de una R baja.',
    'La resistividad del suelo cambia con humedad, temperatura y composición.',
  ],
};
