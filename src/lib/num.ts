/** Utilidades numéricas y de formato (convención es-CO: coma decimal, punto de miles). */

const nf = (min: number, max: number) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

/** Formatea con decimales fijos (si decimals es undefined, hasta 2 sin ceros de relleno). */
export function fmt(n: number, decimals?: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 0.001 || abs >= 1e7)) {
    const exp = n.toExponential(decimals ?? 2);
    return exp.replace('.', ',');
  }
  if (decimals === undefined) {
    return nf(0, 2).format(n);
  }
  return nf(decimals, decimals).format(n);
}

/** Notación científica legible: 3,2 × 10⁻⁴ */
export function sci(n: number, decimals = 2): string {
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / Math.pow(10, exp);
  const sup: Record<string, string> = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  const supExp = String(exp).split('').map((c) => sup[c] ?? c).join('');
  return `${fmt(mant, decimals)} × 10${supExp}`;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const deg = (rad: number) => (rad * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;

/** Raíz cúbica con signo. */
export const cbrt = (x: number) => Math.sign(x) * Math.pow(Math.abs(x), 1 / 3);

export const roundUp = (x: number) => Math.ceil(x - 1e-9);

/** Función error (Abramowitz & Stegun 7.1.26). */
export function erf(x: number): number {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}

/** CDF normal estándar. */
export const normalCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

/** PDF normal. */
export const normalPdf = (z: number) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);

/** Inversa aproximada de la normal estándar (Acklam). */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - plow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const rr = q * q;
  return (
    (((((a[0] * rr + a[1]) * rr + a[2]) * rr + a[3]) * rr + a[4]) * rr + a[5]) * q /
    (((((b[0] * rr + b[1]) * rr + b[2]) * rr + b[3]) * rr + b[4]) * rr + 1)
  );
}

/** Escala "bonita" para ejes. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const stepMul = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
  const step = stepMul * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return ticks;
}

/** Interpola una serie tabulada [[x,y],...] en un x dado. */
export function interp(points: [number, number][], x: number): number {
  if (points.length === 0) return NaN;
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const f = (x - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * f;
    }
  }
  return points[points.length - 1][1];
}

/**
 * Onda normalizada de doble exponencial (cresta = 1).
 * Devuelve la función normalizada, la cresta y el instante de cresta.
 */
export function doubleExp(tauFront: number, tauTail: number) {
  const f = (t: number) =>
    Math.exp(-t / tauTail) - Math.exp(-t / Math.max(tauFront, 1e-6));
  let peak = 0;
  let tPeak = 0;
  const N = 4000;
  const tMax = tauTail * 12;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * tMax;
    const v = f(t);
    if (v > peak) {
      peak = v;
      tPeak = t;
    }
  }
  const norm = (t: number) => f(t) / (peak || 1);
  return { norm, peak, tPeak, f };
}

/** Cuantil empírico: tiempo en que la onda normalizada cruza un nivel. */
export function crossTime(fn: (t: number) => number, level: number, tMax: number, rising = true): number {
  const N = 6000;
  if (rising) {
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * tMax;
      if (fn(t) >= level) return t;
    }
    return NaN;
  }
  // descendente: desde la cresta
  let peakT = 0;
  let peakV = -Infinity;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * tMax;
    const v = fn(t);
    if (v > peakV) {
      peakV = v;
      peakT = t;
    }
  }
  for (let i = Math.floor((peakT / tMax) * N); i <= N; i++) {
    const t = (i / N) * tMax;
    if (fn(t) <= level) return t;
  }
  return NaN;
}

/**
 * Tiempos normalizados de una onda de impulso.
 * t1: tiempo virtual de frente = 1,67 (t90 − t30)  [definición tipo rayo]
 * t2: tiempo hasta la semiamplitud, medido desde el cero virtual
 * tp: instante de cresta real
 */
export function impulseTimes(fn: (t: number) => number, tauTail: number) {
  const t30 = crossTime(fn, 0.3, tauTail * 6, true);
  const t90 = crossTime(fn, 0.9, tauTail * 6, true);
  const tp = crossTime(fn, 1, tauTail * 8, true);
  const t0 = t30 - (t90 - t30) / 0.6;
  const half = crossTime(fn, 0.5, tauTail * 10, false);
  return { t1: 1.67 * (t90 - t30), t2: half - t0, tp, t0, half, t30, t90 };
}
