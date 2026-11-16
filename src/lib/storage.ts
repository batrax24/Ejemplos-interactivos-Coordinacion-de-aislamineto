/** Persistencia de progreso del laboratorio. */

export interface ExpProgress {
  done: boolean;
  stars: number;
  attempts: number;
  bestError: number | null;
}

/** Avance en las piezas del laboratorio más allá de los experimentos. */
export interface LabProgress {
  /** Misiones de guardia superadas (id del tema → mejor puntaje). */
  missions: Record<string, number>;
  /** Funciones respondidas correctamente (id → 1). */
  funciones: Record<string, 1>;
  /** Etapa de la sustentación superada (0 = ninguna). */
  defense: number;
}

export interface Progress {
  xp: number;
  seenIntro: boolean;
  enabledAudio: boolean;
  exps: Record<string, ExpProgress>;
  lab: LabProgress;
}

const KEY = 'labca.progress.v2';

export const emptyLab = (): LabProgress => ({ missions: {}, funciones: {}, defense: 0 });

export const emptyProgress = (): Progress => ({
  xp: 0,
  seenIntro: false,
  enabledAudio: true,
  exps: {},
  lab: emptyLab(),
});

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      ...emptyProgress(),
      ...parsed,
      exps: parsed.exps ?? {},
      lab: { ...emptyLab(), ...(parsed.lab ?? {}) },
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* almacenamiento no disponible */
  }
}

export const RANKS = [
  { min: 0, name: 'Aprendiz de línea' },
  { min: 250, name: 'Auxiliar de laboratorio' },
  { min: 600, name: 'Analista de aislamiento' },
  { min: 1100, name: 'Especialista en sobretensiones' },
  { min: 1700, name: 'Ingeniero de coordinación' },
  { min: 2400, name: 'Coordinador senior' },
];

export function rankFor(xp: number) {
  let r = RANKS[0];
  for (const item of RANKS) if (xp >= item.min) r = item;
  const idx = RANKS.indexOf(r);
  const next = RANKS[idx + 1];
  const span = next ? next.min - r.min : 1;
  const prog = next ? Math.min(1, (xp - r.min) / span) : 1;
  return { rank: r, next, prog, idx };
}
