import type { ExperimentDef } from './types';
import { exp01 } from './e01-tensiones';
import { exp02 } from './e02-maniobra';
import { exp03 } from './e03-impulso';
import { exp04 } from './e04-disrupcion';
import { exp05 } from './e05-atmosfera';
import { exp06 } from './e06-cadena';
import { exp07 } from './e07-oscilacion';
import { exp08 } from './e08-separacion';
import { exp09 } from './e09-guarda';
import { exp10 } from './e10-tierra';
import { exp11 } from './e11-ondas';
import { exp12 } from './e12-pararrayos';
import { exp13 } from './e13-corona';
import { exp14 } from './e14-mision';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EXPERIMENTS: ExperimentDef<any>[] = [
  exp01,
  exp02,
  exp03,
  exp04,
  exp05,
  exp06,
  exp07,
  exp08,
  exp09,
  exp10,
  exp11,
  exp12,
  exp13,
  exp14,
];

export const CHAPTERS = [
  {
    id: 'esfuerzos',
    name: 'Esfuerzos',
    subtitle: 'Sobretensiones y formas de onda',
    range: '0 → 30 min',
    ids: ['tensiones', 'maniobra', 'impulso', 'disrupcion'],
    color: '#38e1ff',
  },
  {
    id: 'ambiente',
    name: 'Ambiente y aislamiento',
    subtitle: 'Atmósfera, cadenas y distancias',
    range: '30 → 71 min',
    ids: ['atmosfera', 'cadena', 'oscilacion', 'separacion'],
    color: '#2ee6a8',
  },
  {
    id: 'proteccion',
    name: 'Protección',
    subtitle: 'Guarda, tierra, ondas y descargadores',
    range: '71 → 109 min',
    ids: ['guarda', 'tierra', 'ondas', 'pararrayos'],
    color: '#ffc247',
  },
  {
    id: 'sintesis',
    name: 'Síntesis',
    subtitle: 'Corona y proyecto integrador',
    range: '109 → 120 min',
    ids: ['corona', 'mision'],
    color: '#b48cff',
  },
];

export type { ExperimentDef };
