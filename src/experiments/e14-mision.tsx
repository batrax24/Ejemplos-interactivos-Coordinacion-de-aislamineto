import { fmt, roundUp } from '../lib/num';
import type { ExperimentDef, Params } from './types';
import { C } from '../lib/draw';
import { Scene14 } from './scenes/s14';

const P0 = 101.325;
const T0 = 293.15;
const T_AMB = 20; // °C supuestos para el corredor

export const pressureAt = (m: number) => 101.325 * Math.pow(1 - 2.25577e-5 * m, 5.25588);

interface Data {
  Um: number;
  alt: number;
  kf: number;
  lfDisc: number;
  pitch: number;
  Uc: number;
  Ures: number;
  bil: number;
  delta: number;
  pressure: number;
  Uf: number;
  Upeak: number;
  U50: number;
  U50corr: number;
  nLeak: number;
  nImpulse: number;
  nFinal: number;
  chainLength: number;
  margin: number;
  extra: number;
  Ueq: number;
  UcOk: boolean;
  tov: number;
  tovCap: number;
  tovOk: boolean;
  marginOk: boolean;
  ok: boolean;
}

const compute = (p: Params): Data => {
  const pressure = pressureAt(p.alt);
  const delta = (pressure / P0) * (T0 / (T_AMB + 273.15));
  const Uf = p.Um / Math.sqrt(3);
  const Upeak = Math.SQRT2 * Uf;
  const U50 = 700;
  const U50corr = U50 * Math.pow(delta, 0.75);

  const nLeak = roundUp((p.kf * p.Um) / p.lfDisc);
  const cfoDisc = 60 * Math.pow(delta, 0.75);
  const nImpulse = Math.max(1, roundUp((1.25 * p.Ures) / cfoDisc));
  const nFinal = Math.max(nLeak, nImpulse);

  const extra = 60; // efecto de separación y conexiones, como en el material
  const Ueq = p.Ures + extra;
  const margin = (p.bil / Ueq - 1) * 100;

  const tov = 1.25 * Uf;
  const tovCap = 1.3 * p.Uc;

  return {
    Um: p.Um,
    alt: p.alt,
    kf: p.kf,
    lfDisc: p.lfDisc,
    pitch: p.pitch,
    Uc: p.Uc,
    Ures: p.Ures,
    bil: p.bil,
    delta,
    pressure,
    Uf,
    Upeak,
    U50,
    U50corr,
    nLeak,
    nImpulse,
    nFinal,
    chainLength: nFinal * p.pitch,
    margin,
    extra,
    Ueq,
    UcOk: p.Uc >= Uf * 1.05,
    tov,
    tovCap,
    tovOk: tov <= tovCap,
    marginOk: margin >= 20,
    ok: p.Uc >= Uf * 1.05 && tov <= tovCap && margin >= 20 && nFinal >= nLeak && nFinal >= nImpulse,
  };
};

export const exp14: ExperimentDef<Data> = {
  id: 'mision',
  num: '14',
  title: 'Misión: coordinar la línea',
  kicker: 'Integración de todos los criterios',
  slides: 'Diapositivas 47 a 53 y 59',
  idea:
    'Aquí se juntan los criterios: la altitud corrige el aire, la contaminación fija la cadena, el impulso exige un mínimo propio y el descargador debe cumplir Uc, TOV y margen. Ajusta el proyecto hasta que los cuatro indicadores queden en verde.',
  formulas: [
    'N = máx(N_fuga, N_impulso)',
    'U_c ≥ U_f  ·  U_TOV = 1,25·U_f ≤ 1,3·U_c',
    'M = (BIL / U_eq − 1) × 100 ≥ 20 %',
  ],
  live: (p) => {
    const r = compute(p);
    return [
      `δ(${fmt(p.alt, 0)} m) = ${fmt(r.delta, 3)} → U₅₀ = ${fmt(r.U50corr, 1)} kV`,
      `N_fuga = ${r.nLeak} · N_impulso = ${r.nImpulse} → N = ${r.nFinal} discos`,
      `U_TOV = ${fmt(r.tov, 1)} ≤ ${fmt(r.tovCap, 1)} kV  ${r.tovOk ? '✓' : '✕'}`,
      `M = (${fmt(p.bil, 0)} / ${fmt(r.Ueq, 0)} − 1) × 100 = ${fmt(r.margin, 1)} %  ${r.marginOk ? '✓' : '✕'}`,
    ];
  },
  params: [
    { id: 'Um', label: 'Tensión del proyecto', symbol: 'Uₘ', unit: 'kV', min: 115, max: 500, step: 5, value: 245, decimals: 0 },
    { id: 'alt', label: 'Altitud del corredor', symbol: 'h', unit: 'm s.n.m.', min: 0, max: 3800, step: 25, value: 2640, decimals: 0 },
    { id: 'kf', label: 'Criterio de contaminación', symbol: 'k_f', unit: 'mm/kV', min: 16, max: 40, step: 1, value: 25, decimals: 0 },
    { id: 'lfDisc', label: 'Fuga por disco', symbol: 'L_d', unit: 'mm', min: 200, max: 450, step: 2, value: 292, decimals: 0 },
    { id: 'pitch', label: 'Paso de la cadena', symbol: 'p', unit: 'm', min: 0.1, max: 0.2, step: 0.001, value: 0.146, decimals: 3 },
    { id: 'Uc', label: 'Tensión continua del descargador', symbol: 'U_c', unit: 'kV', min: 40, max: 400, step: 1, value: 150, decimals: 0 },
    { id: 'Ures', label: 'Tensión residual del descargador', symbol: 'U_res', unit: 'kV', min: 300, max: 1100, step: 10, value: 600, decimals: 0 },
    { id: 'bil', label: 'Nivel de aislamiento del equipo', symbol: 'BIL', unit: 'kV', min: 400, max: 1800, step: 25, value: 1050, decimals: 0 },
  ],
  compute,
  readouts: (r) => [
    { label: 'Densidad relativa', symbol: 'δ', value: fmt(r.delta, 3), tone: r.delta > 0.75 ? 'ok' : 'warn' },
    { label: 'U₅₀ corregida (cadena)', symbol: 'U₅₀', value: fmt(r.U50corr, 1), unit: 'kV', tone: 'info' },
    { label: 'Discos por fuga', symbol: 'N_f', value: String(r.nLeak), tone: 'neutral' },
    { label: 'Discos por impulso', symbol: 'N_i', value: String(r.nImpulse), tone: 'neutral' },
    { label: 'Cadena final', symbol: 'N', value: String(r.nFinal), unit: 'discos', tone: 'ok' },
    { label: 'Longitud de cadena', symbol: 'L_c', value: fmt(r.chainLength, 2), unit: 'm', tone: 'warn' },
    { label: 'U_c frente a U_f', value: `${fmt(r.Uc, 0)} / ${fmt(r.Uf, 0)}`, unit: 'kV', tone: r.UcOk ? 'ok' : 'bad' },
    { label: 'TOV de 1 s', value: `${fmt(r.tov, 0)} / ${fmt(r.tovCap, 0)}`, unit: 'kV', tone: r.tovOk ? 'ok' : 'bad' },
    { label: 'Margen del equipo', symbol: 'M', value: fmt(r.margin, 1), unit: '%', tone: r.marginOk ? 'ok' : r.margin > 0 ? 'warn' : 'bad' },
  ],
  verdict: (r) => {
    if (!r.UcOk) return { tone: 'bad', text: 'U_c no cubre la tensión continua fase–tierra: sube la tensión asignada del descargador.' };
    if (!r.tovOk) return { tone: 'bad', text: 'La sobretensión temporal excede la capacidad del descargador: el TOV no está coordinado.' };
    if (!r.marginOk) return { tone: 'bad', text: 'El margen del equipo no alcanza el 20 %: baja U_res o aumenta el BIL.' };
    return { tone: 'ok', text: 'Proyecto coordinado: cadena, altitud, TOV y margen del equipo en verde.' };
  },
  Scene: Scene14,
  Plot: ({ data }) => {
    const lo = 380;
    const hi = 760;
    const sx = (h: number) => 54 + (h / 3800) * 550;
    const sy = (v: number) => 196 - ((v - lo) / (hi - lo)) * 176;
    const pts: [number, number][] = [];
    for (let h = 0; h <= 3800; h += 50) {
      const pr = pressureAt(h);
      const d = (pr / P0) * (T0 / (T_AMB + 273.15));
      pts.push([h, 700 * Math.pow(d, 0.75)]);
    }
    return (
      <div className="plotwrap">
        <svg viewBox="0 0 620 240" className="plot">
          <line x1={54} x2={604} y1={196} y2={196} stroke="rgba(148,180,220,0.35)" />
          <line x1={54} x2={54} y1={16} y2={196} stroke="rgba(148,180,220,0.35)" />
          {[0, 1000, 2000, 3000].map((v) => (
            <g key={v}>
              <line x1={sx(v)} x2={sx(v)} y1={16} y2={196} stroke="rgba(148,180,220,0.08)" />
              <text x={sx(v)} y={214} textAnchor="middle" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          {[400, 500, 600, 700].map((v) => (
            <g key={v}>
              <line x1={54} x2={604} y1={sy(v)} y2={sy(v)} stroke="rgba(148,180,220,0.08)" />
              <text x={48} y={sy(v) + 4} textAnchor="end" className="plot__tick">
                {v}
              </text>
            </g>
          ))}
          <path
            d={pts.map(([h, v], i) => `${i ? 'L' : 'M'}${sx(h).toFixed(1)},${sy(Math.max(lo, Math.min(hi, v))).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={C.teal}
            strokeWidth="2.3"
          />
          <line x1={54} x2={604} y1={sy(Math.max(lo, Math.min(hi, data.Ueq)))} y2={sy(Math.max(lo, Math.min(hi, data.Ueq)))} stroke={C.violet} strokeDasharray="5 4" />
          <text x={600} y={sy(Math.max(lo, Math.min(hi, data.Ueq))) - 6} textAnchor="end" className="plot__note" fill={C.violet}>
            U_eq = {fmt(data.Ueq, 0)} kV
          </text>
          <line x1={54} x2={604} y1={sy(Math.max(lo, Math.min(hi, data.bil)))} y2={sy(Math.max(lo, Math.min(hi, data.bil)))} stroke={C.cyan} strokeDasharray="5 4" />
          <text x={600} y={sy(Math.max(lo, Math.min(hi, data.bil))) + 12} textAnchor="end" className="plot__note" fill={C.cyan}>
            BIL = {fmt(data.bil, 0)} kV
          </text>
          <circle cx={sx(data.alt)} cy={sy(Math.max(lo, Math.min(hi, data.U50corr)))} r={5} fill={C.amber} />
          <text x={sx(data.alt) + 8} y={sy(Math.max(lo, Math.min(hi, data.U50corr))) - 8} className="plot__note" fill={C.amber}>
            {fmt(data.U50corr, 0)} kV
          </text>
          <text x={330} y={232} textAnchor="middle" className="plot__axis">
            altitud (m s.n.m.)
          </text>
          <text x={14} y={110} textAnchor="middle" className="plot__axis" transform="rotate(-90 14 110)">
            tensión (kV)
          </text>
        </svg>
        <div className="plotlegend">
          <span>
            <i style={{ background: C.teal }} />
            U₅₀ corregida por altitud
          </span>
          <span>
            <i style={{ background: C.violet }} />
            tensión que llega al equipo
          </span>
          <span>
            <i style={{ background: C.cyan }} />
            BIL del equipo
          </span>
        </div>
      </div>
    );
  },
  presets: [
    { name: 'Proyecto de referencia (245 kV)', params: { Um: 245, alt: 2640, kf: 25, Uc: 150, Ures: 600, bil: 1050 } },
    { name: 'Altitud extrema (3 600 m)', params: { alt: 3600 } },
    { name: 'Descargador subdimensionado', params: { Uc: 100, Ures: 520 } },
  ],
  challenge: {
    prompt:
      'Deja el proyecto en verde: cadena entre 21 y 25 discos, U_c ≥ U_f, TOV de 1 s dentro de capacidad y margen M ≥ 20 %. Sin sobre-dimensionar.',
    hint:
      'Con Uₘ = 245 kV, k_f = 25 y 292 mm/disco obtienes 21 discos. Para M ≥ 20 % con U_res = 600 necesitas BIL ≥ 792 kV. Para el TOV, U_c ≥ 1,25·U_f/1,3 ≈ 136 kV; 150 kV cumple.',
    goal: '21 ≤ N ≤ 25 · M ≥ 20 % · U_c y TOV en verde',
    test: (p) => {
      const r = compute(p);
      const ok = r.ok && r.nFinal >= 21 && r.nFinal <= 25;
      return {
        pass: ok,
        detail: ok
          ? `N = ${r.nFinal} discos, M = ${fmt(r.margin, 1)} %, TOV ${fmt(r.tov, 0)} ≤ ${fmt(r.tovCap, 0)} kV. Proyecto coordinado.`
          : `N = ${r.nFinal}, M = ${fmt(r.margin, 1)} %, TOV ${fmt(r.tov, 0)}/${fmt(r.tovCap, 0)} kV, U_c ${fmt(r.Uc, 0)}/${fmt(r.Uf, 0)} kV: revisa los criterios en rojo.`,
      };
    },
  },
  notes: [
    'Las etapas del estudio son iterativas: cambiar el pararrayos obliga a revisar la cadena y las distancias.',
    'El efecto de 60 kV por separación y conexiones es el mismo supuesto didáctico del ejemplo de margen.',
    'La confiabilidad y la economía del proyecto forman parte de la decisión final; aquí solo se verifica el método.',
  ],
};
