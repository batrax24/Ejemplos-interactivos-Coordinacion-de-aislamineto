import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene11 } from './scenes/s11';

interface Data {
  Z1: number;
  Z2: number;
  incident: number;
  gamma: number;
  tau: number;
  reflected: number;
  transmitted: number;
  totalAtJunction: number;
  Zc: number;
  vel: number;
}

const compute = (p: Params): Data => {
  const gamma = (p.Z2 - p.Z1) / (p.Z2 + p.Z1);
  const tau = 1 + gamma;
  return {
    Z1: p.Z1,
    Z2: p.Z2,
    incident: p.incident,
    gamma,
    tau,
    reflected: gamma * p.incident,
    transmitted: tau * p.incident,
    totalAtJunction: p.incident + gamma * p.incident,
    Zc: Math.sqrt((p.Lp * 1e-3) / (p.Cp * 1e-9)),
    vel: 1 / Math.sqrt(p.Lp * 1e-3 * p.Cp * 1e-9) / 1e8,
  };
};

export const exp11: ExperimentDef<Data> = {
  id: 'ondas',
  num: '11',
  title: 'Reflexión y transmisión de ondas',
  kicker: 'Ondas viajeras en la línea',
  slides: 'Diapositivas 42 a 45',
  idea:
    'Una onda de tensión que llega a un cambio de impedancia se refleja parcialmente. El coeficiente Γ dice cuánto vuelve y τ cuánto pasa. En un extremo abierto Γ = +1 y la tensión puede duplicarse: por eso la protección de equipos distantes importa.',
  formulas: ['Γᵥ = (Z₂ − Z₁) / (Z₂ + Z₁)', 'τᵥ = 1 + Γᵥ = 2Z₂ / (Z₂ + Z₁)', 'Z_c = √(L′/C′),  v = 1/√(L′C′)'],
  live: (p) => {
    const r = compute(p);
    return [
      `Γᵥ = (${fmt(p.Z2, 0)} − ${fmt(p.Z1, 0)}) / (${fmt(p.Z2, 0)} + ${fmt(p.Z1, 0)}) = ${fmt(r.gamma, 3)}`,
      `V_refl = ${fmt(r.gamma, 3)} × ${fmt(p.incident, 0)} = ${fmt(r.reflected, 1)} kV`,
      `V_trans = ${fmt(r.tau, 3)} × ${fmt(p.incident, 0)} = ${fmt(r.transmitted, 1)} kV`,
    ];
  },
  params: [
    { id: 'Z1', label: 'Impedancia de la línea incidente', symbol: 'Z₁', unit: 'Ω', min: 50, max: 600, step: 5, value: 400, decimals: 0 },
    { id: 'Z2', label: 'Impedancia de la segunda línea o carga', symbol: 'Z₂', unit: 'Ω', min: 0, max: 2000, step: 5, value: 100, decimals: 0 },
    { id: 'incident', label: 'Onda incidente', symbol: 'V_i', unit: 'kV cresta', min: 10, max: 1500, step: 5, value: 100, decimals: 0 },
    { id: 'Lp', label: 'Inductancia por unidad de longitud', symbol: "L′", unit: 'mH/km', min: 0.4, max: 2, step: 0.01, value: 0.9, decimals: 2, wide: true },
    { id: 'Cp', label: 'Capacitancia por unidad de longitud', symbol: "C′", unit: 'nF/km', min: 5, max: 20, step: 0.1, value: 12, decimals: 1, wide: true },
  ],
  compute,
  readouts: (r) => [
    { label: 'Coeficiente de reflexión', symbol: 'Γᵥ', value: fmt(r.gamma, 3), tone: r.gamma < 0 ? 'warn' : 'ok' },
    { label: 'Coeficiente de transmisión', symbol: 'τᵥ', value: fmt(r.tau, 3), tone: 'info' },
    { label: 'Tensión reflejada', symbol: 'V_r', value: fmt(r.reflected, 1), unit: 'kV', tone: 'warn' },
    { label: 'Tensión transmitida', symbol: 'V_t', value: fmt(r.transmitted, 1), unit: 'kV', tone: 'ok' },
    { label: 'Impedancia característica', symbol: 'Z_c', value: fmt(r.Zc, 1), unit: 'Ω', tone: 'neutral' },
    { label: 'Velocidad de propagación', symbol: 'v', value: fmt(r.vel * 3, 3), unit: '×10⁸ m/s', tone: 'neutral' },
  ],
  verdict: (r) => {
    if (r.Z2 === 0) return { tone: 'warn', text: 'Cortocircuito ideal: Γ = −1 y la tensión en el extremo es cero.' };
    if (r.gamma > 0.8) return { tone: 'warn', text: 'Carga casi abierta: la tensión en el extremo puede duplicarse.' };
    return { tone: 'ok', text: 'Transición de impedancia moderada entre la línea y la carga.' };
  },
  Scene: Scene11,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const f = (i / n) * 2; // 0..2 (dos travesías)
      let v = 0;
      if (f <= 1) v = data.incident;
      else v = data.incident + data.reflected * (f - 1) * 2;
      pts.push([f, v]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 0.5, 1, 1.5, 2].map((f) => (
            <g key={f}>
              <line x1={54 + (f / 2) * 550} x2={54 + (f / 2) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (f / 2) * 550} y={214} textAnchor="middle" className="plot__tick">
                {f === 1 ? 'unión' : `${f}`}
              </text>
            </g>
          ))}
          {[-1, -0.5, 0, 0.5, 1, 1.5, 2].map((v) => (
            <g key={v}>
              <line x1={54} x2={604} y1={110 - (v / 2.4) * 88} y2={110 - (v / 2.4) * 88} stroke="rgba(148,180,220,0.07)" />
            </g>
          ))}
          <line x1={54} x2={604} y1={110} y2={110} stroke="rgba(148,180,220,0.3)" />
          <path
            d={pts.map(([f, v], i) => `${i ? 'L' : 'M'}${(54 + (f / 2) * 550).toFixed(1)},${(110 - (v / (data.incident * 2.2)) * 88).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.4"
          />
          <line x1={54 + 275} x2={54 + 275} y1={16} y2={196} stroke={C.amber} strokeDasharray="4 4" />
          <text x={54 + 275} y={30} textAnchor="middle" className="plot__note" fill={C.amber}>
            unión Z₁ → Z₂
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            recurrido de la onda (× longitud del tramo)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            tensión (kV)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (400 → 100 Ω)', params: { Z1: 400, Z2: 100, incident: 100 } },
    { name: 'Extremo abierto (Γ = +1)', params: { Z2: 2000 } },
    { name: 'Cortocircuito (Γ = −1)', params: { Z2: 0 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo: Z₁ = 400 Ω, Z₂ = 100 Ω, onda de 100 kV → Γ = −0,60 y V_trans = 40 kV.',
    hint: 'Γ = (100−400)/(100+400) = −0,6. La transmitida es 100 − 60 = 40 kV.',
    goal: 'Γ = −0,60 · V_trans = 40 kV',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.gamma + 0.6) < 0.02 && Math.abs(r.transmitted - 40) < 1;
      return {
        pass: ok,
        detail: ok
          ? `Γ = ${fmt(r.gamma, 2)} y V_trans = ${fmt(r.transmitted, 1)} kV. En la unión: 100 − 60 = 40 kV.`
          : `Γ = ${fmt(r.gamma, 2)}, V_trans = ${fmt(r.transmitted, 1)} kV; el ejemplo espera −0,60 y 40 kV.`,
      };
    },
  },
  notes: [
    'Un extremo abierto duplica la tensión incidente; por eso importan las ondas que llegan a equipos lejanos.',
    'El modelo de línea sin pérdidas es una idealización para interpretar, no un cálculo de coordinación.',
    'La onda de corriente 8/20 µs se usa para descargadores; no es la onda de tensión 1,2/50 µs.',
  ],
};
