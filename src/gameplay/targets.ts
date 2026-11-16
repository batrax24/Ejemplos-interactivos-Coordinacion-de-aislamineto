/**
 * Criterios de protección por tema.
 *
 * Cada meta se evalúa sobre los parámetros reales del experimento del curso y
 * devuelve una reserva positiva cuando el caso cumple. Las fórmulas y los
 * valores de referencia salen del guion, las diapositivas y la guía de
 * ejercicios; el criterio de aceptación se declara en cada meta.
 *
 * Regla de oro del material: comparar siempre magnitudes de la misma onda, en
 * la misma unidad y con la misma convención (eficaz con eficaz, cresta con
 * cresta, fase–tierra con fase–tierra).
 *
 * Los parámetros que no son sliders del experimento (el esfuerzo exigido, el
 * límite de longitud de la torre, el presupuesto de pérdidas…) llegan en el
 * mismo objeto `Params` del caso y se muestran como datos del enunciado.
 */
import { fmt, normalQuantile } from '../lib/num';
import type { TargetSpec } from './types';

/** U₅₀ de referencia del material (kV cresta) y exponente de la corrección. */
export const U50_BASE = 700;
export const cfoAt = (delta: number) => U50_BASE * Math.pow(delta, 0.75);

/* ----------------------------- T1 · disrupción ---------------------------- */

const t1Cuantil: TargetSpec = {
  id: 't1-cuantil',
  label: 'Cuantil exigido frente al esfuerzo',
  unit: 'kV cresta',
  severity: 'crit',
  meaning: 'positivo = el esfuerzo queda por debajo de la tensión que falla solo el P % de las veces',
  eval: (p) => {
    const sigma = (p.sigmaPct / 100) * p.u50;
    const z = normalQuantile(p.pTarget / 100);
    const up = p.u50 + z * sigma;
    const stress = Math.sqrt(2 / 3) * p.Um * p.Fv;
    return {
      reserve: up - stress,
      detail: `U_${fmt(p.pTarget, 0)} = ${fmt(p.u50, 0)} + (${fmt(z, 3)})·${fmt(sigma, 0)} = ${fmt(up, 0)} kV vs Û_man = ${fmt(stress, 0)} kV`,
    };
  },
};

const t1Firmeza: TargetSpec = {
  id: 't1-firmeza',
  label: 'Esfuerzo bajo U₅₀',
  unit: 'kV cresta',
  severity: 'high',
  meaning: 'positivo = la sobretensión no alcanza la mediana del aislamiento',
  eval: (p) => {
    const stress = Math.sqrt(2 / 3) * p.Um * p.Fv;
    return { reserve: p.u50 - stress, detail: `U₅₀ = ${fmt(p.u50, 0)} kV vs Û_man = ${fmt(stress, 0)} kV` };
  },
};

const t1Dispersion: TargetSpec = {
  id: 't1-dispersion',
  label: 'Dispersión controlada (s ≤ 6 %)',
  unit: 'puntos %',
  severity: 'high',
  meaning: 'positivo = el proceso de fabricación está dentro de lo que el curso considera normal',
  eval: (p) => ({ reserve: 6 - p.sigmaPct, detail: `s = ${fmt(p.sigmaPct, 1)} % de U₅₀` }),
};

/* -------------------------------- T2 · cadena ----------------------------- */

const t2Fuga: TargetSpec = {
  id: 't2-fuga',
  label: 'Fuga montada frente a la exigida',
  unit: 'mm',
  severity: 'crit',
  meaning: 'positivo = los discos instalados cubren la fuga exigida (se admite 1 % de tolerancia de ingeniería)',
  eval: (p) => {
    const need = p.kf * p.Um;
    const lf = p.nInst * p.lfDisc;
    const n = Math.ceil(need / p.lfDisc - 1e-9);
    return {
      reserve: lf - 0.99 * need,
      detail: `instalados ${p.nInst}·${fmt(p.lfDisc, 0)} = ${fmt(lf, 0)} mm vs exigidos ${fmt(need, 0)} mm (⌈…⌉ = ${n} discos)`,
    };
  },
};

const t2Largo: TargetSpec = {
  id: 't2-largo',
  label: 'Longitud de cadena dentro del límite',
  unit: 'm',
  severity: 'crit',
  meaning: 'positivo = la cadena que exige la fuga cabe en la torre del caso',
  eval: (p) => {
    const L = p.nInst * p.pitch;
    return {
      reserve: p.cadMax - L,
      detail: `L = ${p.nInst}·${fmt(p.pitch, 3)} = ${fmt(L, 3)} m vs ${fmt(p.cadMax, 2)} m disponibles`,
    };
  },
};

const t2Impulso: TargetSpec = {
  id: 't2-impulso',
  label: 'Rigidez de la cadena frente al rayo',
  unit: 'kV cresta',
  severity: 'high',
  meaning: 'positivo = la cadena aguanta el impulso de rayo declarado en el caso',
  eval: (p) => {
    const cfo = cfoAt(p.delta);
    return {
      reserve: cfo - p.impulso,
      detail: `U₅₀(δ=${fmt(p.delta, 2)}) = 700·${fmt(p.delta, 2)}^0,75 = ${fmt(cfo, 0)} kV vs ${fmt(p.impulso, 0)} kV`,
    };
  },
};

/* ----------------------------- T3 · separación ---------------------------- */

const t3Separacion: TargetSpec = {
  id: 't3-separacion',
  label: 'Separación real con viento',
  unit: 'm',
  severity: 'crit',
  meaning: 'positivo = la fase conserva la distancia exigida con la cadena inclinada',
  eval: (p) => {
    const dx = p.L * Math.sin((p.theta * Math.PI) / 180);
    return {
      reserve: p.d0 - dx - p.required,
      detail: `d_h = ${fmt(p.d0, 2)} − ${fmt(p.L, 3)}·sen ${fmt(p.theta, 1)}° = ${fmt(p.d0 - dx, 3)} m vs ${fmt(p.required, 2)} m`,
    };
  },
};

const t3Desplazamiento: TargetSpec = {
  id: 't3-desplazamiento',
  label: 'Desplazamiento menor que media distancia',
  unit: 'm',
  severity: 'high',
  meaning: 'positivo = la cadena no se corre más de la mitad de la distancia en reposo',
  eval: (p) => {
    const dx = p.L * Math.sin((p.theta * Math.PI) / 180);
    return {
      reserve: 0.5 * p.d0 - dx,
      detail: `Δx = ${fmt(dx, 3)} m vs 0,5·d₀ = ${fmt(0.5 * p.d0, 2)} m`,
    };
  },
};

const t3FaseFase: TargetSpec = {
  id: 't3-fase-fase',
  label: 'Separación preliminar entre fases',
  unit: 'm',
  severity: 'high',
  meaning: 'positivo = la geometría calculada alcanza la separación de referencia',
  eval: (p) => {
    const d = p.K * Math.sqrt(p.F + p.L) + p.Vn / 150;
    return {
      reserve: d - p.Dref,
      detail: `D = ${fmt(p.K, 2)}·√(${fmt(p.F, 1)}+${fmt(p.L, 2)}) + ${fmt(p.Vn, 0)}/150 = ${fmt(d, 2)} m vs ${fmt(p.Dref, 2)} m`,
    };
  },
};

/* --------------------------- T4 · apantallamiento ------------------------- */

const t4Angulo: TargetSpec = {
  id: 't4-angulo',
  label: 'Ángulo de apantallamiento ≤ 30°',
  unit: '°',
  severity: 'crit',
  meaning: 'positivo = la fase está dentro de la sombra geométrica de la guarda',
  eval: (p) => {
    const a = (Math.atan2(Math.abs(p.dx), Math.abs(p.dh)) * 180) / Math.PI;
    return {
      reserve: 30 - a,
      detail: `α = arctan(${fmt(Math.abs(p.dx), 1)}/${fmt(Math.abs(p.dh), 1)}) = ${fmt(a, 1)}° vs límite 30°`,
    };
  },
};

const t4Electro: TargetSpec = {
  id: 't4-electro',
  label: 'Método electrogeométrico',
  unit: 'm',
  severity: 'high',
  meaning: 'positivo = el radio de atracción cubre la separación guarda–fase con 20 % de reserva',
  eval: (p) => {
    const rc = 10 * Math.pow(Math.max(1, p.current), 0.65);
    const sep = Math.hypot(p.dx, p.dh);
    return {
      reserve: 1.6 * rc - sep,
      detail: `1,6·r_c = 1,6·${fmt(rc, 1)} = ${fmt(1.6 * rc, 1)} m vs separación ${fmt(sep, 2)} m`,
    };
  },
};

const t4Sombra: TargetSpec = {
  id: 't4-sombra',
  label: 'Cobertura de sombra por lado',
  unit: 'm',
  severity: 'mid',
  meaning: 'positivo = la sombra cubre el desplazamiento horizontal Δx',
  eval: (p) => {
    const a = Math.atan2(Math.abs(p.dx), Math.abs(p.dh));
    const rc = 10 * Math.pow(Math.max(1, p.current), 0.65);
    const b = rc * Math.sin(a);
    return { reserve: b - Math.abs(p.dx), detail: `b = r_c·sen α = ${fmt(b, 1)} m vs Δx = ${fmt(Math.abs(p.dx), 1)} m` };
  },
};

/* ------------------------------ T5 · tierra ------------------------------- */

const t5Potencial: TargetSpec = {
  id: 't5-potencial',
  label: 'Potencial de torre frente a la cadena',
  unit: 'kV',
  severity: 'crit',
  meaning: 'positivo = la cadena no flamea cuando el rayo entra por la torre',
  eval: (p) => {
    const vt = p.current * p.Rt + p.L * p.diDt;
    return {
      reserve: p.Ucad - vt,
      detail: `V_t = ${fmt(p.current, 1)}·${fmt(p.Rt, 1)} + ${fmt(p.L, 1)}·${fmt(p.diDt, 1)} = ${fmt(vt, 1)} kV vs ${fmt(p.Ucad, 0)} kV`,
    };
  },
};

const t5Personas: TargetSpec = {
  id: 't5-personas',
  label: 'Potencial de tierra admisible',
  unit: 'kV',
  severity: 'high',
  meaning: 'positivo = la elevación queda bajo el límite de paso y contacto del caso',
  eval: (p) => {
    const vt = p.current * p.Rt + p.L * p.diDt;
    return { reserve: p.Vmax - vt, detail: `V_t = ${fmt(vt, 1)} kV vs ${fmt(p.Vmax, 0)} kV` };
  },
};

const t5Resistencia: TargetSpec = {
  id: 't5-resistencia',
  label: 'Resistencia de puesta a tierra',
  unit: 'Ω',
  severity: 'mid',
  meaning: 'positivo = R_t cumple el objetivo de diseño del caso',
  eval: (p) => ({ reserve: p.Rref - p.Rt, detail: `R_t = ${fmt(p.Rt, 1)} Ω vs objetivo ${fmt(p.Rref, 1)} Ω` }),
};

/* ----------------------------- T6 · pararrayos ---------------------------- */

const t6Margen: TargetSpec = {
  id: 't6-margen',
  label: 'Margen de protección del equipo',
  unit: '%',
  severity: 'crit',
  meaning: 'positivo = el margen supera el mínimo exigido por el proyecto',
  eval: (p) => {
    const uEq = p.Ures + p.Lconn * p.diDt * p.distance;
    const m = (p.withstand / uEq - 1) * 100;
    return {
      reserve: m - p.requiredMargin,
      detail: `M = (${fmt(p.withstand, 0)}/${fmt(uEq, 0)} − 1)·100 = ${fmt(m, 1)} % vs ${fmt(p.requiredMargin, 0)} %`,
    };
  },
};

const t6Tov: TargetSpec = {
  id: 't6-tov',
  label: 'TOV dentro de la capacidad U_c',
  unit: 'kV',
  severity: 'high',
  meaning: 'positivo = la sobretensión temporal no agota el descargador',
  eval: (p) => {
    const tov = 1.25 * (p.Um / Math.sqrt(3));
    return {
      reserve: 1.3 * p.Uc - tov,
      detail: `TOV = 1,25·${fmt(p.Um, 0)}/√3 = ${fmt(tov, 1)} kV vs capacidad 1,3·U_c = ${fmt(1.3 * p.Uc, 1)} kV`,
    };
  },
};

/* ------------------------------- T7 · corona ------------------------------ */

const t7Perdidas: TargetSpec = {
  id: 't7-perdidas',
  label: 'Pérdidas por corona en presupuesto',
  unit: 'kW/km',
  severity: 'crit',
  meaning: 'positivo = las pérdidas caben en el presupuesto de la línea',
  eval: (p) => {
    const diff = Math.max(0, p.U - p.U0);
    const P = (242 / p.delta) * (p.f + 25) * Math.sqrt(p.r / p.s) * diff * diff * 1e-5;
    return { reserve: p.budget - P, detail: `P = ${fmt(P, 2)} kW/km vs presupuesto ${fmt(p.budget, 1)} kW/km` };
  },
};

const t7Incepcion: TargetSpec = {
  id: 't7-incepcion',
  label: 'Holgura sobre la incepción',
  unit: 'kV',
  severity: 'high',
  meaning: 'positivo = la línea no opera pegada al umbral de corona',
  eval: (p) => ({
    reserve: p.U - 1.1 * p.U0,
    detail: `U = ${fmt(p.U, 0)} kV vs 1,1·U₀ = ${fmt(1.1 * p.U0, 0)} kV`,
  }),
};

export const TARGETS: TargetSpec[] = [
  t1Cuantil,
  t1Firmeza,
  t1Dispersion,
  t2Fuga,
  t2Largo,
  t2Impulso,
  t3Separacion,
  t3Desplazamiento,
  t3FaseFase,
  t4Angulo,
  t4Electro,
  t4Sombra,
  t5Potencial,
  t5Personas,
  t5Resistencia,
  t6Margen,
  t6Tov,
  t7Perdidas,
  t7Incepcion,
];

export const targetById = (id: string): TargetSpec => TARGETS.find((t) => t.id === id)!;

/** Utilidad para los casos: reserva mínima 0 salvo que se indique otra. */
export const goal = (target: string, min = 0) => ({ target, min });
