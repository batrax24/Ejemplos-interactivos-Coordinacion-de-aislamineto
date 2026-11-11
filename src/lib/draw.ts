/* Helpers de dibujo en canvas para las escenas animadas del laboratorio. */

export type Ctx = CanvasRenderingContext2D;

export const C = {
  bg0: '#050a12',
  bg1: '#081422',
  ink: '#e7f0fb',
  dim: '#8da7c4',
  faint: 'rgba(141,167,196,0.35)',
  cyan: '#38e1ff',
  teal: '#2ee6a8',
  amber: '#ffc247',
  orange: '#ff8a3d',
  red: '#ff5c6c',
  violet: '#b48cff',
  blue: '#5b8dff',
  steel: '#7d93ad',
  ground: '#16243a',
};

export function clear(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C.bg1);
  g.addColorStop(1, C.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function grid(ctx: Ctx, w: number, h: number, step = 28, alpha = 0.06) {
  ctx.save();
  ctx.strokeStyle = `rgba(120,180,240,${alpha})`;
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function label(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: {
    color?: string;
    size?: number;
    align?: CanvasTextAlign;
    weight?: number;
    mono?: boolean;
    bg?: string;
    baseline?: CanvasTextBaseline;
  } = {},
) {
  const {
    color = C.ink,
    size = 12,
    align = 'left',
    weight = 500,
    mono = false,
    bg,
    baseline = 'alphabetic',
  } = opts;
  ctx.save();
  ctx.font = `${weight} ${size}px ${mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'Inter, system-ui, sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (bg) {
    const tw = ctx.measureText(text).width;
    const padX = 5;
    let x0 = x - padX;
    if (align === 'center') x0 = x - tw / 2 - padX;
    if (align === 'right') x0 = x - tw - padX;
    ctx.fillStyle = bg;
    const hgt = size + 7;
    ctx.beginPath();
    ctx.roundRect(x0, y - hgt + 3, tw + padX * 2, hgt, 4);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function line(
  ctx: Ctx,
  pts: [number, number][],
  color: string,
  width = 2,
  dash?: number[],
  glow = 0,
) {
  if (pts.length < 2) return;
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

export function arrow(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1.6,
  both = false,
  dash?: number[],
) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 7;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const headAt = (x: number, y: number, a: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - head * Math.cos(a - 0.4), y - head * Math.sin(a - 0.4));
    ctx.lineTo(x - head * Math.cos(a + 0.4), y - head * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  };
  headAt(x2, y2, ang);
  if (both) headAt(x1, y1, ang + Math.PI);
  ctx.restore();
}

export function glowDot(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha * 0.55;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.restore();
}

/** Brazo/estructura metálica simple. */
export function steelBeam(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w = 5, color = '#8fa6bd') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = Math.max(1, w * 0.28);
  ctx.beginPath();
  ctx.moveTo(x1 - w * 0.2, y1);
  ctx.lineTo(x2 - w * 0.2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Torre de celosía estilizada; devuelve puntos de cruceta. */
export function latticeTower(
  ctx: Ctx,
  cx: number,
  baseY: number,
  height: number,
  opts: { width?: number; color?: string; alpha?: number; braces?: boolean } = {},
) {
  const { width = 46, color = '#93a9c0', alpha = 1, braces = true } = opts;
  const topW = width * 0.22;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const topY = baseY - height;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, baseY);
  ctx.lineTo(cx - topW / 2, topY);
  ctx.moveTo(cx + width / 2, baseY);
  ctx.lineTo(cx + topW / 2, topY);
  ctx.stroke();
  if (braces) {
    const n = 9;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(160,190,215,0.55)';
    for (let i = 0; i < n; i++) {
      const f0 = i / n;
      const f1 = (i + 1) / n;
      const y0 = baseY - f0 * height;
      const y1 = baseY - f1 * height;
      const w0 = width + (topW - width) * f0;
      const w1 = width + (topW - width) * f1;
      ctx.beginPath();
      ctx.moveTo(cx - w1 / 2, y1);
      ctx.lineTo(cx + w0 / 2, y0);
      ctx.moveTo(cx + w1 / 2, y1);
      ctx.lineTo(cx - w0 / 2, y0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Terreno con rayado. */
export function groundLine(ctx: Ctx, w: number, y: number, color = C.steel) {
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + 40);
  g.addColorStop(0, 'rgba(46,230,168,0.16)');
  g.addColorStop(1, 'rgba(46,230,168,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, 40);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(148,180,210,0.4)';
  ctx.lineWidth = 1;
  for (let x = 6; x < w; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 9);
    ctx.stroke();
  }
  ctx.restore();
}

/** Disco de aislador (elipse con brillo). */
export function insulatorDisc(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone = '#b9c9dc',
  energize = 0,
) {
  ctx.save();
  const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
  g.addColorStop(0, 'rgba(70,90,115,0.95)');
  g.addColorStop(0.35, tone);
  g.addColorStop(0.65, tone);
  g.addColorStop(1, 'rgba(70,90,115,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,32,48,0.75)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (energize > 0) {
    ctx.globalAlpha = energize;
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 1.5, ry + 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Cadena de N discos entre dos puntos; devuelve posiciones. */
export function insulatorChain(
  ctx: Ctx,
  x: number,
  yTop: number,
  length: number,
  n: number,
  opts: { maxShown?: number; rx?: number; ry?: number; energize?: number; showAll?: boolean } = {},
) {
  const { maxShown = 16, rx = 13, ry = 5, energize = 0, showAll = true } = opts;
  const shown = Math.min(n, maxShown);
  const step = length / Math.max(1, n);
  const ryEff = Math.min(ry, Math.max(1.6, step * 0.42));
  const pts: [number, number][] = [];
  for (let i = 0; i < shown; i++) {
    const cy = yTop + step * (i + 0.5);
    pts.push([x, cy]);
    insulatorDisc(ctx, x, cy, rx, ryEff, '#c3d2e4', energize);
  }
  if (showAll && n > maxShown) {
    label(ctx, `+${n - maxShown}`, x + rx + 4, yTop + length - 2, { color: C.dim, size: 10, mono: true });
  }
  // varilla central
  ctx.save();
  ctx.strokeStyle = 'rgba(180,200,220,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x, yTop + length);
  ctx.stroke();
  ctx.restore();
  return pts;
}

/** Conductor visto de frente con leve catenaria. */
export function conductor(
  ctx: Ctx,
  x1: number,
  x2: number,
  y: number,
  sag: number,
  color = '#8fa6bd',
  width = 2.4,
  glow = 0,
) {
  const pts: [number, number][] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const x = x1 + (x2 - x1) * f;
    const yy = y + sag * Math.sin(Math.PI * f);
    pts.push([x, yy]);
  }
  line(ctx, pts, color, width, undefined, glow);
  return pts;
}

/** Rayo estilizado entre dos puntos con ramificaciones. */
export function lightning(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, seed = 1, color = '#cfe9ff', width = 2.4) {
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const segs = 7;
  const pts: [number, number][] = [[x1, y1]];
  for (let i = 1; i < segs; i++) {
    const f = i / segs;
    const nx = x1 + (x2 - x1) * f + (rnd() - 0.5) * 22;
    const ny = y1 + (y2 - y1) * f;
    pts.push([nx, ny]);
  }
  pts.push([x2, y2]);
  line(ctx, pts, color, width, undefined, 14);
  ctx.save();
  ctx.strokeStyle = 'rgba(190,225,255,0.55)';
  ctx.lineWidth = 1;
  for (let i = 1; i < pts.length - 1; i++) {
    if (rnd() > 0.45) {
      const [px, py] = pts[i];
      const dx = (rnd() - 0.5) * 34;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + dx, py + 14 + rnd() * 16);
      ctx.stroke();
    }
  }
  ctx.restore();
  return pts;
}

/** Estela de osciloscopio: dibuja serie de puntos en un rect. */
export function sparkline(
  ctx: Ctx,
  pts: [number, number][],
  rect: { x: number; y: number; w: number; h: number },
  color: string,
  width = 1.8,
  fill = false,
) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const sx = (x: number) => rect.x + ((x - x0) / (x1 - x0 || 1)) * rect.w;
  const sy = (y: number) => rect.y + rect.h - ((y - y0) / (y1 - y0 || 1)) * rect.h;
  const path: [number, number][] = pts.map(([x, y]) => [sx(x), sy(y)]);
  if (fill && path.length) {
    ctx.save();
    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    g.addColorStop(0, `${color}55`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(path[0][0], rect.y + rect.h);
    for (const [px, py] of path) ctx.lineTo(px, py);
    ctx.lineTo(path[path.length - 1][0], rect.y + rect.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  line(ctx, path, color, width, undefined, 8);
}

/** Semicírculo tipo medidor con aguja. */
export function gauge(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  frac: number,
  color: string,
  text?: string,
  sub?: string,
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(150,180,210,0.22)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
  ctx.stroke();
  const f = Math.min(1, Math.max(0, frac));
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * f);
  ctx.stroke();
  ctx.restore();
  if (text) label(ctx, text, cx, cy - 6, { color, size: 15, align: 'center', weight: 700, mono: true });
  if (sub) label(ctx, sub, cx, cy + 9, { color: C.dim, size: 9.5, align: 'center' });
}

/** Barra vertical simple. */
export function bar(
  ctx: Ctx,
  x: number,
  yBase: number,
  w: number,
  maxH: number,
  frac: number,
  color: string,
  radius = 3,
) {
  ctx.save();
  roundRect(ctx, x, yBase - maxH, w, maxH, radius, 'rgba(255,255,255,0.05)');
  const hh = Math.max(1, Math.min(1, frac) * maxH);
  roundRect(ctx, x, yBase - hh, w, hh, radius, color);
  ctx.restore();
}

export function firefly(ctx: Ctx, t: number, x0: number, y0: number, spread: number, n = 14, color = C.violet) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const px = x0 + Math.sin(t * 0.5 + i * 1.7) * spread * (0.4 + 0.6 * ((i * 37) % 10) / 10);
    const py = y0 + Math.cos(t * 0.4 + i * 2.3) * spread * 0.5;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + i);
    glowDot(ctx, px, py, 1.6, color, 1);
  }
  ctx.restore();
}

/** Marca de verificación dibujada (no depende de glifos de la fuente). */
export function checkMark(ctx: Ctx, x: number, y: number, size: number, color: string, width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y);
  ctx.lineTo(x - size * 0.12, y + size * 0.42);
  ctx.lineTo(x + size * 0.5, y - size * 0.45);
  ctx.stroke();
  ctx.restore();
}

/** Marca de error dibujada. */
export function crossMark(ctx: Ctx, x: number, y: number, size: number, color: string, width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  const h = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(x - h, y - h);
  ctx.lineTo(x + h, y + h);
  ctx.moveTo(x + h, y - h);
  ctx.lineTo(x - h, y + h);
  ctx.stroke();
  ctx.restore();
}

/** Pequeña muestra de color para leyendas. */
export function swatch(ctx: Ctx, x: number, y: number, color: string, w = 9, h = 3) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.restore();
}
