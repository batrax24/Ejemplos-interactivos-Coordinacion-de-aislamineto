import { deg, fmt, rad } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene09 } from './scenes/s09';

interface Data {
  dh: number;
  dx: number;
  alpha: number;
  exposed: boolean;
  topAngle: number;
  strikeDistance: number;
  protectedWidth: number;
  ratio: number;
}

const compute = (p: Params): Data => {
  const alpha = deg(Math.atan2(p.dx, p.dh));
  const exposed = p.dx / Math.max(p.dh, 0.05) > 1;
  const strikeDistance = 10 * Math.pow(p.current, 0.65);
  return {
    dh: p.dh,
    dx: p.dx,
    alpha,
    exposed,
    topAngle: alpha,
    strikeDistance,
    protectedWidth: strikeDistance * Math.sin(rad(alpha)),
    ratio: p.dx / Math.max(p.dh, 0.05),
  };
};

export const exp09: ExperimentDef<Data> = {
  id: 'guarda',
  num: '09',
  title: 'Ángulo de apantallamiento',
  kicker: 'Ubicación del cable de guarda',
  slides: 'Diapositivas 33 a 36',
  idea:
    'El ángulo de apantallamiento describe qué tan lateral está la fase respecto al cable de guarda. Ángulos mayores dejan más expuesta la fase; el método electrogeométrico permite estimar esa exposición con la corriente del rayo.',
  formulas: ['α = arctan(Δx / Δh)', 'R_s ≈ 10 · I^0,65 (radio de atracción del líder)', 'Sombra ≈ R_s · sen α'],
  live: (p) => {
    const r = compute(p);
    return [
      `α = arctan(${fmt(p.dx, 2)} / ${fmt(p.dh, 2)}) = ${fmt(r.alpha, 1)}°`,
      `R_s = 10 × ${fmt(p.current, 1)}^0,65 = ${fmt(r.strikeDistance, 1)} m`,
      `Sombra horizontal ≈ ${fmt(r.protectedWidth, 1)} m por lado`,
    ];
  },
  params: [
    { id: 'dh', label: 'Diferencia de altura guarda–fase', symbol: 'Δh', unit: 'm', min: 1, max: 12, step: 0.1, value: 5, decimals: 1 },
    { id: 'dx', label: 'Separación horizontal', symbol: 'Δx', unit: 'm', min: -6, max: 6, step: 0.1, value: 4, decimals: 1 },
    { id: 'current', label: 'Corriente de rayo considerada', symbol: 'I', unit: 'kA', min: 2, max: 200, step: 1, value: 31, decimals: 0 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Ángulo de apantallamiento', symbol: 'α', value: fmt(r.alpha, 1), unit: '°', tone: Math.abs(r.alpha) < 30 ? 'ok' : 'warn' },
    { label: 'Radio de atracción', symbol: 'R_s', value: fmt(r.strikeDistance, 1), unit: 'm', tone: 'info' },
    { label: 'Sombra horizontal por lado', symbol: 'b', value: fmt(r.protectedWidth, 1), unit: 'm', tone: 'neutral' },
    { label: 'Relación Δx/Δh', value: fmt(r.ratio, 2), tone: r.exposed ? 'bad' : 'ok' },
  ],
  verdict: (r) => {
    if (Math.abs(r.alpha) > 45) return { tone: 'bad', text: 'Ángulo mayor de 45°: la fase queda muy expuesta a descargas laterales.' };
    if (Math.abs(r.alpha) > 30) return { tone: 'warn', text: 'Ángulo alto para transmisión: evalúa con el método electrogeométrico.' };
    return { tone: 'ok', text: 'Ángulo dentro de rangos habituales de apantallamiento.' };
  },
  Scene: Scene09,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let a = -80; a <= 80; a += 1) {
      pts.push([a, (data.strikeDistance * Math.abs(Math.sin(rad(a))))]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((a) => (
            <g key={a}>
              <line x1={54 + ((a + 80) / 160) * 550} x2={54 + ((a + 80) / 160) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + ((a + 80) / 160) * 550} y={214} textAnchor="middle" className="plot__tick">
                {a}°
              </text>
            </g>
          ))}
          {[0, 30, 60, 90].map((b) => (
            <g key={b}>
              <line x1={54} x2={604} y1={196 - (b / 90) * 176} y2={196 - (b / 90) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (b / 90) * 176} textAnchor="end" className="plot__tick">
                {b}
              </text>
            </g>
          ))}
          <rect x={54 + (50 / 160) * 550} y={16} width={(60 / 160) * 550} height={180} fill="rgba(255,92,108,0.08)" />
          <path
            d={pts.map(([a, b], i) => `${i ? 'L' : 'M'}${(54 + ((a + 80) / 160) * 550).toFixed(1)},${(196 - (Math.min(b, 90) / 90) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.cyan}
            strokeWidth="2.2"
          />
          <circle cx={54 + ((data.alpha + 80) / 160) * 550} cy={196 - (Math.min(data.protectedWidth, 90) / 90) * 176} r={5} fill={C.amber} />
          <text x={54 + ((data.alpha + 80) / 160) * 550 + 8} y={196 - (Math.min(data.protectedWidth, 90) / 90) * 176 - 8} className="plot__note" fill={C.amber}>
            α = {fmt(data.alpha, 1)}°
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            ángulo de apantallamiento (grados desde la vertical)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            semiancho protegido (m)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (5 m, 4 m)', params: { dh: 5, dx: 4 } },
    { name: 'Guarda centrada', params: { dx: 0 } },
    { name: 'Fase fuera de sombra', params: { dx: 6, dh: 2 } },
  ],
  challenge: {
    prompt: 'Reproduce el ejemplo: Δh = 5 m y Δx = 4 m → α ≈ 38,7°. Después decide si ese ángulo es aceptable.',
    hint: 'arctan(4/5) = 38,66°. Deja Δh = 5,0 y Δx = 4,0.',
    goal: 'α ≈ 38,7°',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(r.alpha - 38.66) <= 0.6;
      return {
        pass: ok,
        detail: ok
          ? `α = ${fmt(r.alpha, 1)}°. Ojo: el valor geométrico por sí solo no demuestra protección.`
          : `α = ${fmt(r.alpha, 1)}°; el ejemplo busca 38,7°.`,
      };
    },
  },
  notes: [
    'La convención de signos se declara en cada esquema: no todas las fuentes miden desde la vertical.',
    'El cable de guarda reduce la probabilidad de impacto directo, pero no elimina el flameo inverso.',
    'La flecha y la posición en el vano también afectan el apantallamiento real.',
  ],
};
