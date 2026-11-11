import { describe, expect, it } from 'vitest';
import { doubleExp, impulseTimes, normalQuantile, roundUp } from '../num';
import { exp01 } from '../../experiments/e01-tensiones';
import { exp02 } from '../../experiments/e02-maniobra';
import { exp03 } from '../../experiments/e03-impulso';
import { exp04 } from '../../experiments/e04-disrupcion';
import { exp05, pressureAtAltitude } from '../../experiments/e05-atmosfera';
import { exp06 } from '../../experiments/e06-cadena';
import { exp07 } from '../../experiments/e07-oscilacion';
import { exp08 } from '../../experiments/e08-separacion';
import { exp09 } from '../../experiments/e09-guarda';
import { exp10 } from '../../experiments/e10-tierra';
import { exp11 } from '../../experiments/e11-ondas';
import { exp12 } from '../../experiments/e12-pararrayos';
import { exp13 } from '../../experiments/e13-corona';
import { exp14 } from '../../experiments/e14-mision';
import { defaults } from '../../experiments/types';
import type { ExperimentDef, Params } from '../../experiments/types';

const P = (def: { params: ExperimentDef['params'] }, over: Params = {}): Params => ({
  ...defaults(def.params),
  ...over,
});

describe('num', () => {
  it('redondea hacia arriba tolerando flotantes', () => {
    expect(roundUp(20.98)).toBe(21);
    expect(roundUp(21.0000000001)).toBe(21);
    expect(roundUp(0.4)).toBe(1);
  });

  it('cuantil normal para 10 %', () => {
    expect(normalQuantile(0.1)).toBeCloseTo(-1.2816, 3);
    expect(normalQuantile(0.5)).toBeCloseTo(0, 6);
  });

  it('onda normalizada 1,2/50 µs', () => {
    const w = doubleExp(0.41, 66);
    const t = impulseTimes(w.norm, 66);
    expect(t.t1).toBeGreaterThan(1.0);
    expect(t.t1).toBeLessThan(1.4);
    expect(t.t2).toBeGreaterThan(44);
    expect(t.t2).toBeLessThan(56);
  });
});

describe('experimentos del material', () => {
  it('01 convierte 245 kV a 200 kV de cresta', () => {
    const r = exp01.compute(P(exp01));
    expect(r.UfRms).toBeCloseTo(141.45, 1);
    expect(r.UfPeak).toBeCloseTo(200.04, 1);
  });

  it('02 reproduce U_soporte = 575,1 kV', () => {
    const r = exp02.compute(P(exp02));
    expect(r.Us).toBeCloseTo(500.1, 1);
    expect(r.UsReq).toBeCloseTo(575.1, 0);
  });

  it('03 produce una onda 1,2/50 µs', () => {
    const r = exp03.compute(P(exp03));
    expect(r.t1).toBeGreaterThan(1.0);
    expect(r.t1).toBeLessThan(1.4);
    expect(r.t2).toBeGreaterThan(44);
    expect(r.t2).toBeLessThan(56);
  });

  it('04 da U10 = 646,2 kV', () => {
    const r = exp04.compute(P(exp04));
    expect(r.sigma).toBeCloseTo(42, 5);
    expect(r.uP).toBeCloseTo(646.2, 0);
  });

  it('05 la densidad baja con la altitud', () => {
    const p0 = P(exp05);
    const sea = exp05.compute({ ...p0, manual: 0, alt: 0, tempC: 20 });
    const bog = exp05.compute({ ...p0, manual: 0, alt: 2640, tempC: 14 });
    expect(pressureAtAltitude(0)).toBeCloseTo(101.325, 2);
    expect(sea.delta).toBeCloseTo(1, 2);
    expect(bog.delta).toBeGreaterThan(0.7);
    expect(bog.delta).toBeLessThan(0.8);
    expect(bog.u50).toBeLessThan(sea.u50);
  });

  it('06 da 21 discos para 245 kV / 25 mm/kV', () => {
    const r = exp06.compute(P(exp06));
    expect(r.lfReq).toBe(6125);
    expect(r.nExact).toBeCloseTo(20.98, 1);
    expect(r.n).toBe(21);
    expect(r.chainLength).toBeCloseTo(3.066, 3);
  });

  it('07 da d_h = 1,967 m a 30°', () => {
    const r = exp07.compute(P(exp07));
    expect(r.dx).toBeCloseTo(1.533, 2);
    expect(r.dh).toBeCloseTo(1.967, 2);
    expect(r.ok).toBe(false);
  });

  it('08 da D = 4,02 m', () => {
    const r = exp08.compute(P(exp08));
    expect(r.term1).toBeCloseTo(2.49, 1);
    expect(r.term2).toBeCloseTo(1.53, 1);
    expect(r.D).toBeCloseTo(4.02, 1);
  });

  it('09 da 38,7° de apantallamiento', () => {
    const r = exp09.compute(P(exp09));
    expect(r.alpha).toBeCloseTo(38.66, 1);
  });

  it('10 da 150 kV con 10 kA y 15 Ω', () => {
    const r = exp10.compute(P(exp10, { L: 0 }));
    expect(r.Vt).toBeCloseTo(150, 5);
    expect(r.flashover).toBe(false);
    const r5 = exp10.compute({ ...P(exp10, { L: 0 }), Rt: 5 });
    expect(r5.Vt).toBeCloseTo(50, 5);
  });

  it('11 reproduce Γ = −0,60 y 40 kV', () => {
    const r = exp11.compute(P(exp11));
    expect(r.gamma).toBeCloseTo(-0.6, 6);
    expect(r.transmitted).toBeCloseTo(40, 6);
  });

  it('12 reproduce M = 59,1 %', () => {
    const r = exp12.compute(P(exp12));
    expect(r.extra).toBeCloseTo(60, 5);
    expect(r.UinEquipment).toBeCloseTo(660, 5);
    expect(r.margin).toBeCloseTo(59.09, 1);
  });

  it('13 reproduce 10,29 kW/km', () => {
    const r = exp13.compute(P(exp13));
    expect(r.P).toBeCloseTo(10.29, 1);
  });

  it('14 integra cadena, TOV y margen', () => {
    const r = exp14.compute(P(exp14));
    expect(r.nLeak).toBe(21);
    expect(r.nFinal).toBeGreaterThanOrEqual(21);
    expect(r.margin).toBeGreaterThan(20);
    expect(r.tovOk).toBe(true);
    expect(r.UcOk).toBe(true);
    expect(r.ok).toBe(true);
  });
});

describe('retos alcanzables', () => {
  const defs: { id: string; challenge: ExperimentDef['challenge']; params: ExperimentDef['params'] }[] = [
    exp01, exp02, exp03, exp04, exp05, exp06, exp07,
    exp08, exp09, exp10, exp11, exp12, exp13, exp14,
  ];

  const cases: [string, Params][] = [
    [exp01.id, { Um: 245 }],
    [exp02.id, { Um: 245, Fv: 2.5, factor: 1.15 }],
    [exp03.id, { front: 0.41, tail: 66 }],
    [exp04.id, { u50: 700, sigmaPct: 6, pTarget: 10 }],
    [exp05.id, { alt: 1950, tempC: 20, manual: 0 }],
    [exp06.id, { Um: 245, kf: 25, lfDisc: 292 }],
    [exp07.id, { L: 3.066, theta: 28, d0: 3.5, required: 2.42 }],
    [exp08.id, { K: 0.75, F: 8, L: 3, Vn: 230 }],
    [exp09.id, { dh: 5, dx: 4 }],
    [exp10.id, { current: 20, Rt: 20, L: 1, diDt: 10 }],
    [exp11.id, { Z1: 400, Z2: 100, incident: 100 }],
    [exp12.id, { Ures: 600, distance: 6, diDt: 10, Lconn: 1 }],
    [exp13.id, { f: 60, delta: 0.9, r: 1.5, s: 600, U: 150, U0: 120 }],
    [exp14.id, { Um: 245, alt: 2640, kf: 25, Ures: 600, bil: 1050, Uc: 150, lfDisc: 292 }],
  ];

  it.each(cases)('%s se puede cumplir con el preset indicado', (id, over) => {
    const def = defs.find((d) => d.id === id)!;
    const res = def.challenge.test(P(def, over));
    expect(res.pass, res.detail).toBe(true);
  });
});
