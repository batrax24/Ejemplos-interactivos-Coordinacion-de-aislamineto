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
  /** Último borrador de cada jornada (id del tema → medidas elegidas). */
  drafts: Record<string, Record<string, string>>;
  /** Mejor nota de cada nivel de sustentación (1…3 → aciertos de 5). */
  defenseBest: Record<string, number>;
}

export interface Progress {
  xp: number;
  seenIntro: boolean;
  enabledAudio: boolean;
  exps: Record<string, ExpProgress>;
  lab: LabProgress;
}

const KEY = 'labca.progress.v2';
/** Copia de seguridad de la última lectura válida (por si el guardado se corrompe). */
const BACKUP = 'labca.progress.backup';

export const emptyLab = (): LabProgress => ({
  missions: {},
  funciones: {},
  defense: 0,
  drafts: {},
  defenseBest: {},
});

export const emptyProgress = (): Progress => ({
  xp: 0,
  seenIntro: false,
  enabledAudio: true,
  exps: {},
  lab: emptyLab(),
});

/** Lee un guardado y lo normaliza sin lanzar: cualquier forma rara se arregla. */
export function normalizeProgress(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const parsed = raw as Partial<Progress> & { lab?: Partial<LabProgress> };
  const exps = parsed.exps && typeof parsed.exps === 'object' ? parsed.exps : {};
  const lab: Partial<LabProgress> =
    parsed.lab && typeof parsed.lab === 'object' ? (parsed.lab as Partial<LabProgress>) : {};
  return {
    ...base,
    xp: Number.isFinite(parsed.xp) ? Math.max(0, Number(parsed.xp)) : 0,
    seenIntro: Boolean(parsed.seenIntro),
    enabledAudio: parsed.enabledAudio !== false,
    exps: Object.fromEntries(
      Object.entries(exps).map(([k, v]) => [
        k,
        {
          done: Boolean((v as ExpProgress)?.done),
          stars: Math.min(3, Math.max(0, Number((v as ExpProgress)?.stars) || 0)),
          attempts: Math.max(0, Number((v as ExpProgress)?.attempts) || 0),
          bestError: Number.isFinite((v as ExpProgress)?.bestError) ? Number((v as ExpProgress).bestError) : null,
        },
      ]),
    ),
    lab: {
      missions: (lab.missions as LabProgress['missions']) ?? {},
      funciones: (lab.funciones as LabProgress['funciones']) ?? {},
      defense: Math.min(4, Math.max(0, Number(lab.defense) || 0)),
      drafts: (lab.drafts as LabProgress['drafts']) ?? {},
      defenseBest: (lab.defenseBest as LabProgress['defenseBest']) ?? {},
    },
  };
}

export interface LoadResult {
  progress: Progress;
  /** Se recuperó de la copia de seguridad porque el guardado estaba corrupto. */
  recovered: boolean;
  /** No había nada guardado. */
  fresh: boolean;
}

export function loadProgressDetailed(): LoadResult {
  const parse = (txt: string | null): Progress | null => {
    if (!txt) return null;
    try {
      return normalizeProgress(JSON.parse(txt));
    } catch {
      return null;
    }
  };
  try {
    const main = parse(localStorage.getItem(KEY));
    if (main) return { progress: main, recovered: false, fresh: false };
    const backup = parse(localStorage.getItem(BACKUP));
    if (backup) return { progress: backup, recovered: true, fresh: false };
    localStorage.removeItem(KEY);
    return { progress: emptyProgress(), recovered: false, fresh: true };
  } catch {
    // localStorage bloqueado (modo privado, cuota, iframe restringido)
    return { progress: emptyProgress(), recovered: false, fresh: true };
  }
}

export function loadProgress(): Progress {
  return loadProgressDetailed().progress;
}

export function saveProgress(p: Progress) {
  try {
    const json = JSON.stringify(p);
    localStorage.setItem(KEY, json);
    localStorage.setItem(BACKUP, json);
  } catch {
    /* almacenamiento no disponible: el juego sigue funcionando en memoria */
  }
}

/** Descarga el progreso como archivo para no perderlo al cambiar de equipo. */
export function exportProgress(p: Progress): string {
  return JSON.stringify({ app: 'labca', version: 2, savedAt: new Date().toISOString(), progress: p }, null, 2);
}

/** Importa un archivo exportado; devuelve null si no es válido. */
export function importProgress(text: string): Progress | null {
  try {
    const parsed = JSON.parse(text) as { progress?: unknown };
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = 'progress' in parsed ? parsed.progress : parsed;
    const norm = normalizeProgress(candidate);
    // Una importación válida tiene que aportar algo: XP o alguna marca.
    const algo =
      norm.xp > 0 ||
      Object.keys(norm.exps).length > 0 ||
      Object.keys(norm.lab.funciones).length > 0 ||
      Object.keys(norm.lab.missions).length > 0;
    return algo ? norm : null;
  } catch {
    return null;
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP);
  } catch {
    /* sin almacenamiento */
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
