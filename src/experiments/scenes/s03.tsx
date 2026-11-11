import { useCanvas } from '../../lib/hooks';
import { C, arrow, clear, grid, label, line, roundRect, glowDot } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  label: string;
  points: [number, number][];
  t1: number;
  t2: number;
  amplitude: number;
}

/** Escena: generador de impulso + osciloscopio con traza en vivo. */
export function Scene03({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    // generador de impulso a la izquierda
    const gx = 46;
    const gy = h * 0.30;
    roundRect(ctx, gx, gy, 96, h * 0.50, 10, 'rgba(12,26,42,0.9)', 'rgba(180,140,255,0.35)');
    label(ctx, 'GENERADOR', gx + 48, gy + 20, { color: C.violet, size: 9.5, align: 'center', weight: 700 });
    // condensadores
    for (let i = 0; i < 3; i++) {
      const cxp = gx + 24 + i * 24;
      line(ctx, [[cxp, gy + 38], [cxp, gy + 62]], C.steel, 2);
      line(ctx, [[cxp - 8, gy + 62], [cxp + 8, gy + 62]], C.violet, 2.4);
      line(ctx, [[cxp - 8, gy + 68], [cxp + 8, gy + 68]], C.violet, 2.4);
      line(ctx, [[cxp, gy + 68], [cxp, gy + 92]], C.steel, 2);
    }
    // chispa
    const sparkOn = Math.sin(t * 6) > 0.2;
    for (let i = 0; i < 6; i++) {
      {
        const px = gx + 48 + Math.sin(t * 9 + i) * 12;
        const py = gy + 108 + Math.cos(t * 7 + i) * 6;
        glowDot(ctx, px, py, 1.4, C.cyan, sparkOn ? 0.7 : 0.15);
      }
    }
    label(ctx, 'impulso', gx + 48, gy + 138, { color: C.dim, size: 9.5, align: 'center' });

    // aislamiento bajo ensayo: cadena
    const ax = w * 0.46;
    const topY = 54;
    const botY = h - 56;
    line(ctx, [[ax, topY], [ax, botY]], 'rgba(180,200,220,0.45)', 1.2);
    line(ctx, [[ax - 34, topY], [ax + 34, topY]], '#93a9c0', 4);
    for (let i = 0; i < 9; i++) {
      const cy = topY + 26 + i * ((botY - topY - 50) / 9);
      ctx.save();
      ctx.fillStyle = 'rgba(196,212,230,0.9)';
      ctx.beginPath();
      ctx.ellipse(ax, cy, 17, 4.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    line(ctx, [[ax - 40, botY], [ax + 40, botY]], '#93a9c0', 4);

    // descarga (flash) cuando la onda supera 50 %
    const flash = Math.max(0, Math.sin(t * 2.2));
    if (flash > 0.85) {
      ctx.save();
      ctx.strokeStyle = 'rgba(200,235,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax - 20, topY + 30);
      for (let i = 0; i < 7; i++) {
        ctx.lineTo(ax + (i % 2 ? 22 : -22), topY + 50 + i * ((botY - topY - 80) / 7));
      }
      ctx.stroke();
      ctx.restore();
    }
    label(ctx, 'aislamiento bajo ensayo', ax, topY - 10, { color: C.dim, size: 9.5, align: 'center' });

    // osciloscopio
    const ox = w * 0.60;
    const oy = 40;
    const ow = w - ox - 22;
    const oh = h - 92;
    roundRect(ctx, ox, oy, ow, oh, 10, 'rgba(5,15,26,0.95)', 'rgba(56,225,255,0.3)', 1.4);
    label(ctx, 'OSCILOSCOPIO', ox + 10, oy + 16, { color: C.cyan, size: 9.5, weight: 700 });
    label(ctx, `${data.label} µs`, ox + ow - 10, oy + 16, { color: C.amber, size: 10, align: 'right', mono: true });

    const plot = { x: ox + 14, y: oy + 28, w: ow - 28, h: oh - 58 };
    ctx.save();
    ctx.strokeStyle = 'rgba(148,180,220,0.10)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const yy = plot.y + (i / 8) * plot.h;
      ctx.beginPath();
      ctx.moveTo(plot.x, yy);
      ctx.lineTo(plot.x + plot.w, yy);
      ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const xx = plot.x + (i / 10) * plot.w;
      ctx.beginPath();
      ctx.moveTo(xx, plot.y);
      ctx.lineTo(xx, plot.y + plot.h);
      ctx.stroke();
    }
    ctx.restore();

    let peak = 1;
    for (const [, v] of data.points) peak = Math.max(peak, v);
    const xMax = data.points[data.points.length - 1][0];
    const tracePts = data.points.map(([x, v]) => [
      plot.x + (x / xMax) * plot.w,
      plot.y + plot.h - (v / (peak * 1.05)) * plot.h,
    ] as [number, number]);
    line(ctx, tracePts, C.amber, 2, undefined, 8);

    // marcador de cresta
    const peakIdx = data.points.reduce((best, p, i) => (p[1] > data.points[best][1] ? i : best), 0);
    const [pkx, pky] = data.points[peakIdx];
    const mpx = plot.x + (pkx / xMax) * plot.w;
    const mpy = plot.y + plot.h - (pky / (peak * 1.05)) * plot.h;
    glowDot(ctx, mpx, mpy, 3, C.cyan, 0.8);
    label(ctx, `${fmt(data.amplitude, 0)} kV`, mpx + 6, mpy - 6, { color: C.cyan, size: 9.5, mono: true });

    label(ctx, 'tiempo →', plot.x + plot.w, oy + oh - 10, { color: C.dim, size: 9, align: 'right' });
    label(ctx, `${data.t1.toFixed(1)} µs frente · ${data.t2.toFixed(0)} µs cola`, ox + 12, oy + oh - 10, {
      color: C.dim,
      size: 9,
    });

    // flecha de conexión generador → aislamiento
    arrow(ctx, gx + 110, h * 0.55, ax - 52, topY + 20, 'rgba(56,225,255,0.45)', 1.4, false, [5, 4]);
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
