import type { FC } from 'react';

export type Params = Record<string, number>;

export interface ParamDef {
  id: string;
  label: string;
  symbol?: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  hint?: string;
  /** Ancho relativo en la rejilla de controles (1 = normal, 2 = doble). */
  wide?: boolean;
  decimals?: number;
  /** Tipo de control; por defecto slider. */
  kind?: 'slider' | 'toggle';
  /** Muestra el control solo si se cumple la condición. */
  showIf?: (p: Params) => boolean;
}

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export interface Readout {
  label: string;
  symbol?: string;
  value: string;
  unit?: string;
  tone?: Tone;
  note?: string;
}

export interface CheckResult {
  pass: boolean;
  detail: string;
}

export interface Challenge {
  /** Enunciado del reto. */
  prompt: string;
  /** Pista que se revela a pedido. */
  hint: string;
  /** Evalúa si se cumple con los parámetros actuales. */
  test: (p: Params) => CheckResult;
  /** Texto corto que resume la meta, p. ej. "N = 21 discos". */
  goal: string;
}

export interface Verdict {
  tone: Tone;
  text: string;
}

export interface ExperimentDef<R = unknown> {
  id: string;
  num: string;
  title: string;
  kicker: string;
  slides: string;
  idea: string;
  formulas: string[];
  /** Líneas de la ecuación con los valores actuales sustituidos. */
  live: (p: Params) => string[];
  params: ParamDef[];
  compute: (p: Params) => R;
  readouts: (r: R) => Readout[];
  verdict?: (r: R) => Verdict;
  Scene: FC<{ data: R }>;
  Plot: FC<{ data: R }>;
  challenge: Challenge;
  notes?: string[];
  /** Presets rápidos (nombre + valores de parámetros). */
  presets?: { name: string; params: Partial<Params> }[];
}

export const defaults = (defs: ParamDef[]): Params =>
  Object.fromEntries(defs.map((d) => [d.id, d.value]));
