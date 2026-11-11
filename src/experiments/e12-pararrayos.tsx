import { fmt } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene12 } from './scenes/s12';

interface Data {
  Um: number;
  Uc: number;
  Ures: number;
  distance: number;
  extra: number;
  UinEquipment: number;
  Uwithstand: number;
  margin: number;
  ok: boolean;
  Uf: number;
  ratioUc: number;
  protectiveLevel: number;
}

const compute = (p: Params): Data => {
  const extra = p.distance * p.diDt * p.Lconn;
  const UinEquipment = p.Ures + extra;
  const Uf = p.Um / Math.sqrt(3);
  const margin = (p.withstand / UinEquipment - 1) * 100;
  return {
    Um: p.Um,
    Uc: p.Uc,
    Ures: p.Ures,
    distance: p.distance,
    extra,
    UinEquipment,
    Uwithstand: p.withstand,
    margin,
    ok: margin >= p.requiredMargin,
    Uf,
    ratioUc: p.Uc / p.Um,
    protectiveLevel: UinEquipment,
  };
};

export const exp12: ExperimentDef<Data> = {
  id: 'pararrayos',
  num: '12',
  title: 'Margen de protección del pararrayos',
  kicker: 'Descargador de óxido metálico',
  slides: 'Diapositivas 46 a 53',
  idea:
    'El pararrayos limita la tensión en sus bornes, pero el equipo protegido está más lejos: la separación y las conexiones añaden caída inductiva. El margen compara lo que soporta el equipo contra lo que realmente le llega.',
  formulas: ['U_en equipo = U_res + L·(di/dt)·d', 'M = (U_soportada / U_en equipo − 1) × 100 %', 'U_c ≥ tensión continua fase–tierra'],
  live: (p) => {
    const r = compute(p);
    return [
      `U_en equipo = ${fmt(p.Ures, 0)} + ${fmt(r.extra, 1)} = ${fmt(r.UinEquipment, 1)} kV cresta`,
      `M = (${fmt(p.withstand, 0)} / ${fmt(r.UinEquipment, 1)} − 1) × 100 = ${fmt(r.margin, 1)} %`,
      `U_c ${p.Uc >= r.Uf ? '≥' : '<'} U_f = ${fmt(r.Uf, 1)} kV  ${p.Uc >= r.Uf ? '✓' : '✕'}`,
    ];
  },
  params: [
    { id: 'Um', label: 'Tensión del sistema', symbol: 'Uₘ', unit: 'kV', min: 13.8, max: 800, step: 0.2, value: 245, decimals: 1 },
    { id: 'Uc', label: 'Tensión continua máxima del descargador', symbol: 'U_c', unit: 'kV', min: 5, max: 500, step: 1, value: 150, decimals: 0 },
    { id: 'Ures', label: 'Tensión residual', symbol: 'U_res', unit: 'kV cresta', min: 200, max: 1200, step: 5, value: 600, decimals: 0 },
    { id: 'withstand', label: 'Tensión soportada del equipo (BIL)', symbol: 'BIL', unit: 'kV cresta', min: 300, max: 2400, step: 10, value: 1050, decimals: 0 },
    { id: 'distance', label: 'Distancia pararrayos–equipo', symbol: 'd', unit: 'm', min: 0, max: 30, step: 0.5, value: 6, decimals: 1 },
    { id: 'Lconn', label: 'Inductancia de conexiones', symbol: "L_c", unit: 'µH/m', min: 0.4, max: 2, step: 0.05, value: 1, decimals: 2 },
    { id: 'diDt', label: 'Pendiente de corriente', symbol: 'di/dt', unit: 'kA/µs', min: 1, max: 20, step: 0.5, value: 10, decimals: 1 },
    { id: 'requiredMargin', label: 'Margen mínimo exigido', symbol: 'M_min', unit: '%', min: 0, max: 80, step: 5, value: 20, decimals: 0 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Tensión fase–tierra', symbol: 'U_f', value: fmt(r.Uf, 1), unit: 'kV', tone: r.Uc >= r.Uf ? 'ok' : 'bad' },
    { label: 'Efecto de la separación', symbol: 'L·di/dt·d', value: fmt(r.extra, 1), unit: 'kV', tone: r.extra > 60 ? 'warn' : 'info' },
    { label: 'Tensión en el equipo', symbol: 'U_eq', value: fmt(r.UinEquipment, 1), unit: 'kV', tone: 'warn' },
    { label: 'Margen de protección', symbol: 'M', value: fmt(r.margin, 1), unit: '%', tone: r.ok ? 'ok' : r.margin > 0 ? 'warn' : 'bad' },
  ],
  verdict: (r) => {
    if (r.margin < 0) return { tone: 'bad', text: 'El equipo ve más tensión de la que soporta: el pararrayos está mal ubicado o subdimensionado.' };
    if (!r.ok) return { tone: 'warn', text: 'El margen existe pero no alcanza el mínimo exigido para este proyecto.' };
    if (r.Uc < r.Uf) return { tone: 'bad', text: 'U_c es menor que la tensión continua fase–tierra: el descargador no es aplicable.' };
    return { tone: 'ok', text: 'Margen suficiente y U_c compatible con la tensión del sistema.' };
  },
  Scene: Scene12,
  Plot: ({ data }) => {
    const pts: [number, number][] = [];
    for (let d = 0; d <= 30; d += 0.5) {
      const ue = data.Ures + data.extra * (d / Math.max(0.001, data.distance));
      pts.push([d, (data.Uwithstand / ue - 1) * 100]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 5, 10, 15, 20, 25, 30].map((d) => (
            <g key={d}>
              <line x1={54 + (d / 30) * 550} x2={54 + (d / 30) * 550} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={54 + (d / 30) * 550} y={214} textAnchor="middle" className="plot__tick">
                {d}
              </text>
            </g>
          ))}
          {[0, 20, 40, 60].map((m) => (
            <g key={m}>
              <line x1={54} x2={604} y1={196 - (m / 60) * 176} y2={196 - (m / 60) * 176} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={200 - (m / 60) * 176} textAnchor="end" className="plot__tick">
                {m}%
              </text>
            </g>
          ))}
          <path
            d={pts.map(([d, m], i) => `${i ? 'L' : 'M'}${(54 + (d / 30) * 550).toFixed(1)},${(196 - (Math.max(0, Math.min(m, 60)) / 60) * 176).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.teal}
            strokeWidth="2.2"
          />
          <circle cx={54 + (data.distance / 30) * 550} cy={196 - (Math.max(0, Math.min(data.margin, 60)) / 60) * 176} r={5} fill={data.ok ? C.teal : C.orange} />
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            distancia pararrayos–equipo (m)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            margen M (%)
          </text>
        </svg>
      </div>
    );
  },
  presets: [
    { name: 'Ejemplo del curso (U_res 600, +60 kV)', params: { Ures: 600, distance: 6, diDt: 10, withstand: 1050 } },
    { name: 'Equipo al lado del pararrayos', params: { distance: 0.5 } },
    { name: 'Separación excesiva (20 m)', params: { distance: 20 } },
  ],
  challenge: {
    prompt: 'Ajusta la distancia para reproducir el ejemplo: U_res = 600 kV y efecto adicional ≈ 60 kV (con L_c = 1 µH/m y di/dt = 10 kA/µs).',
    hint: 'L·di/dt·d = 1 × 10 × 6 = 60 kV. Deja la distancia en 6 m.',
    goal: 'efecto adicional ≈ 60 kV',
    test: (p) => {
      const r = compute(p);
      const ok = Math.abs(p.Ures - 600) < 1 && Math.abs(r.extra - 60) <= 5;
      return {
        pass: ok,
        detail: ok
          ? `U_en equipo = ${fmt(r.UinEquipment, 1)} kV y M = ${fmt(r.margin, 1)} %.`
          : `Efecto adicional = ${fmt(r.extra, 1)} kV; el ejemplo usa 60 kV con U_res = 600.`,
      };
    },
  },
  notes: [
    'La tensión residual se mide en los bornes del pararrayos, no en el equipo.',
    'M = 59,1 % en el ejemplo del curso es ilustrativo: la aceptación depende del método y del proyecto.',
    'La separación al equipo y la longitud de conexiones modifican el nivel de protección real.',
    'Verifica además energía, TOV y capacidad de cortocircuito.',
  ],
};
