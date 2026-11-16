/**
 * Motor de juego del laboratorio.
 *
 * Cada experimento es una ecuación que se puede mover; el juego añade lo que
 * pide la coordinación de aislamiento: decidir si una instalación está
 * protegida, con qué margen y a qué costo.
 *
 * Un "día de guardia" (`DailySpec`) plantea casos reales y un maletín de
 * medidas. El estudiante diagnostica, aplica una medida a cada caso y envía la
 * jornada. La jornada es válida si ningún caso queda desprotegido.
 *
 * Toda meta se evalúa sobre parámetros reales del experimento (los mismos
 * sliders), de modo que la escena y la gráfica muestran la medida aplicada.
 */
import type { Params } from '../experiments/types';

export type Severity = 'crit' | 'high' | 'mid';

export interface EvalResult {
  /** Reserva en la unidad del criterio; positiva = protegido. */
  reserve: number;
  /** Texto con las cuentas, p. ej. "N = 21 vs N_f = 21". */
  detail: string;
}

export interface TargetSpec {
  id: string;
  label: string;
  unit: string;
  severity: Severity;
  /** Qué significa un valor positivo de la reserva. */
  meaning: string;
  eval: (p: Params) => EvalResult;
}

export interface OptionSpec {
  id: string;
  label: string;
  /** Icono del set de ui.tsx. */
  icon: string;
  /** Transforma los parámetros del caso. */
  apply: (p: Params) => Params;
  /** Explicación física de la medida. */
  effect: string;
  /**
   * Si la medida "parece" proteger sin cambiar la física del fenómeno, aquí va
   * la razón. Estas medidas nunca cuentan como protección válida.
   */
  falseProtection?: string;
}

export interface CaseGoal {
  target: string;
  /** Reserva mínima aceptable. */
  min: number;
}

export interface CaseSpec {
  id: string;
  name: string;
  /** Contexto: qué se está revisando. */
  brief: string;
  params: Params;
  goals: CaseGoal[];
  /** Medidas no disponibles en este caso. */
  locked?: string[];
  /** Pronóstico correcto para el paso 1. */
  forecast?: 'falla' | 'sostiene';
  /** Qué enseña el caso. */
  lesson: string;
}

export interface DailySpec {
  mission: string;
  brief: string;
  cases: CaseSpec[];
  options: OptionSpec[];
  /** Cierre: qué se aprendió. */
  debrief: { good: string; bad: string };
  /** Punto fino para la sustentación. */
  tip: string;
}

export type Picks = Record<string, string | undefined>;

export interface GoalResult {
  target: TargetSpec;
  goal: CaseGoal;
  result: EvalResult;
  pass: boolean;
  option?: OptionSpec;
  /** La medida elegida no cambia la física: no protege aunque el número pase. */
  fake: boolean;
}

export interface CaseResult {
  spec: CaseSpec;
  goals: GoalResult[];
  pass: boolean;
  applied: boolean;
}

export interface DayReport {
  cases: CaseResult[];
  valid: boolean;
  incidents: number;
  criticals: number;
  score: number;
  failed: CaseResult[];
}

export const merge = (base: Params, patch?: Params): Params => ({ ...base, ...(patch ?? {}) });

export const SEVERITY_LABEL: Record<Severity, string> = {
  crit: 'crítico',
  high: 'alto',
  mid: 'medio',
};

/**
 * Resuelve una jornada: aplica la medida elegida a cada caso y evalúa sus metas.
 * Si el caso no tiene medida, se evalúa la instalación tal como está.
 */
export function evaluateDay(spec: DailySpec, targets: TargetSpec[], picks: Picks): DayReport {
  const byId = new Map(targets.map((t) => [t.id, t]));
  const cases: CaseResult[] = spec.cases.map((c) => {
    const optionId = picks[c.id];
    const found = spec.options.find((o) => o.id === optionId);
    const option = found && !(c.locked ?? []).includes(found.id) ? found : undefined;
    const params = merge(c.params, option?.apply(c.params));
    const goals: GoalResult[] = c.goals.map((g) => {
      const target = byId.get(g.target)!;
      const result = target.eval(params);
      const fake = Boolean(option?.falseProtection);
      return { target, goal: g, result, pass: result.reserve >= g.min && !fake, option, fake };
    });
    return { spec: c, goals, pass: goals.every((g) => g.pass), applied: Boolean(option) };
  });

  const failed = cases.filter((c) => !c.pass);
  const incidents = failed.length;
  const criticals = failed.filter((c) => c.goals.some((g) => !g.pass && g.target.severity === 'crit')).length;
  const fakeCount = cases.filter((c) => c.goals.some((g) => g.fake)).length;
  const valid = incidents === 0;
  const score = valid
    ? Math.max(0, 100 - 15 * fakeCount)
    : Math.round((100 * (cases.length - incidents)) / cases.length);
  return { cases, valid, incidents, criticals, score, failed };
}

/** Aciertos del diagnóstico previo (paso 1). */
export function forecastScore(spec: DailySpec, forecast: Record<string, 'falla' | 'sostiene' | undefined>) {
  const declared = spec.cases.filter((c) => c.forecast);
  const hits = declared.filter((c) => forecast[c.id] === c.forecast);
  return { hits: hits.length, total: declared.length };
}
