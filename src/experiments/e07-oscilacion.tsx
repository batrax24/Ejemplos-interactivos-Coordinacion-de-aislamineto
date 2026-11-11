import { deg, fmt, rad } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene07 } from './scenes/s07';

interface Data {
  L: number;
  theta: number;
  d0: number;
  dx: number;
  dh: number;
  required: number;
  clearance: number;
  ok: boolean;
  angleDeg: number;
}

const compute = (p: Params): Data => {
  const dx = p.L * Math.sin(rad(p.theta));
  const dh = p.d0 - dx;
  return {
    L: p.L,
    theta: p.theta,
    d0: p.d0,
    dx,
    dh,
    required: p.required,
    clearance: dh - p.required,
    ok: dh >= p.required,
    angleDeg: p.theta,
  };
};

export const exp07: ExperimentDef<Data> = {
  id: 'oscilacion',
  num: '07',
  title: 'Desplazamiento por viento',
  kicker: 'Distancia fase–estructura',
  slides: 'Diapositivas 28 a 30',
  idea:
    'Cuando la cadena de suspensión se inclina, el conductor se acerca a la torre. El modelo plano Δx = L·sen θ permite ver de inmediato cuándo la distancia disponible deja de cumplir la separación exigida.',
  formulas: ['Δx = L · sen θ', 'd_h = d₀ − L · sen θ', 'θ = arcsen(Δx / L)'],
  live: (p) => {
    const r = compute(p);
    return [
      `Δx = ${fmt(p.L, 3)} × sen(${fmt(p.theta, 1)}°) = ${fmt(r.dx, 3)} m`,
      `d_h = ${fmt(p.d0, 2)} − ${fmt(r.dx, 3)} = ${fmt(r.dh, 3)} m`,
      `margen = ${fmt(r.dh, 3)} − ${fmt(p.required, 2)} = ${fmt(r.clearance, 3)} m`,
    ];
  },
  params: [
    { id: 'L', label: 'Longitud de la cadena', symbol: 'L', unit: 'm', min: 1, max: 7, step: 0.001, value: 3.066, decimals: 3 },
    { id: 'theta', label: 'Inclinación por viento', symbol: 'θ', unit: '°', min: 0, max: 65, step: 0.5, value: 30, decimals: 1 },
    { id: 'd0', label: 'Distancia en reposo', symbol: 'd₀', unit: 'm', min: 1.5, max: 7, step: 0.01, value: 3.5, decimals: 2 },
    { id: 'required', label: 'Separación exigida', symbol: 'd_req', unit: 'm', min: 1, max: 4, step: 0.01, value: 2.42, decimals: 2 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Desplazamiento horizontal', symbol: 'Δx', value: fmt(r.dx, 3), unit: 'm', tone: 'warn' },
    { label: 'Distancia con viento', symbol: 'd_h', value: fmt(r.dh, 3), unit: 'm', tone: r.ok ? 'ok' : 'bad' },
    { label: 'Margen disponible', value: fmt(r.clearance, 3), unit: 'm', tone: r.clearance > 0.15 ? 'ok' : r.clearance >= 0 ? 'warn' : 'bad' },
    { label: 'Inclinación', symbol: 'θ', value: fmt(r.angleDeg, 1), unit: '°', tone: 'info' },
  ],
  verdict: (r) =>
    r.ok
      ? { tone: 'ok', text: 'La distancia con viento todavía cumple la separación exigida en el modelo plano.' }
      : { tone: 'bad', text: 'La cadena se acerca demasiado a la estructura: aumenta d₀, acorta L o reduce θ.' },
  Scene: Scene07,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let a = 0; a <= 65; a += 1) {
      pts.push([a, data.d0 - data.L * Math.sin(rad(a))]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 10, 20, 30, 40, 50, 60].map((a) => (
            <g key={a}>
              <line x1={54 + (a / 65) * 550} x2={54 + (a / 65) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (a / 65) * 550} y={214} textAnchor="middle" className="plot__tick">
                {a}°
              </text>
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((d) => (
            <g key={d}>
              <line x1={54} x2={604} y1={196 - (d / 4) * 176} y2={196 - (d / 4) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (d / 4) * 176} textAnchor="end" className="plot__tick">
                {d}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([a, d], i) => `${i ? 'L' : 'M'}${(54 + (a / 65) * 550).toFixed(1)},${(196 - (Math.min(d, 4) / 4) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.2"
          />
          <line x1={54} x2={604} y1={196 - (data.required / 4) * 176} y2={196 - (data.required / 4) * 176} stroke={C.red} strokeDasharray="6 4" />
          <text x={604} y={196 - (data.required / 4) * 176 - 6} textAnchor="end" className="plot__note" fill={C.red}>
            exigida {fmt(data.required, 2)} m
          </text>
          <circle cx={54 + (data.theta / 65) * 550} cy={196 - (Math.min(data.dh, 4) / 4) * 176} r={5} fill={data.ok ? C.teal : C.orange} />
          <line x1={54 + (data.theta / 65) * 550} x2={54 + (data.theta / 65) * 550} y1={16} y2={196} stroke={data.ok ? C.teal : C.orange} strokeDasharray="4 4" />
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            inclinación de la cadena θ (grados)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            distancia horizontal d_h (m)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (3,066 m, 30°, 3,50 m)', params: { L: 3.066, theta: 30, d0: 3.5, required: 2.42 } },
    { name: 'Viento fuerte (45°)', params: { theta: 45 } },
    { name: 'Cadena corta (2 m)', params: { L: 2 } },
  ],
  challenge: {
    prompt: 'Ajusta θ para que la distancia con viento quede por debajo de la exigida (2,42 m) pero sin bajar de 2,0 m. Busca la violación justa.',
    hint: 'dl = d₀ − L·sen θ. Con d₀ = 3,50 y L = 3,066, necesitas sen θ > (3,50−2,42)/3,066 ≈ 0,352, es decir θ > 20,6°. Prueba 28°.',
    goal: '2,0 ≤ d_h < 2,42 m',
    test: (p) => {
      const r = compute(p);
      const ok = r.dh >= 2.0 && r.dh < 2.42;
      return {
        pass: ok,
        detail: ok
          ? `d_h = ${fmt(r.dh, 3)} m: el viento consume el margen y entra en zona de incumplimiento.`
          : `d_h = ${fmt(r.dh, 3)} m; busca entre 2,000 y 2,419 m.`,
      };
    },
  },
  notes: [
    'Martínez Velasco reporta 3,20 m sin viento y 2,47 m con viento frente a 2,42 m calculados: el desplazamiento decide.',
    'En 3D la distancia mínima real puede ocurrir en otro punto de la cadena o de la ventana de la torre.',
    'La temperatura del conductor cambia la flecha y puede cambiar la geometría del vano.',
  ],
};

export const thetaFor = (dx: number, L: number) => deg(Math.asin(Math.min(1, dx / L)));
