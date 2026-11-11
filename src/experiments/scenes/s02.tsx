import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  Um: number;
  Fv: number;
  UfPeak: number;
  Us: number;
  UsReq: number;
}

/** Escena: reconexión de línea con oscilación de maniobra. */
export function Scene02({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);
    const yBase = h * 0.52;
    const xL = 40;
    const xR = w - 46;

    // barraje de la fuente con tres fases
    line(ctx, [[xL, yBase - 84], [xL, yBase + 84]], '#93a9c0', 5);
    for (let k = 0; k < 3; k++) {
      const yy = yBase - 30 + k * 30;
      line(ctx, [[xL + 5, yy], [xL + 52, yy]], k === 1 ? C.cyan : C.steel, 2.2, undefined, k === 1 ? 6 : 0);
      glowDot(ctx, xL + 5, yy, 2.6, k === 1 ? C.cyan : C.steel, 0.85);
    }
    label(ctx, 'fuente', xL, yBase + 102, { color: C.dim, size: 10, align: 'center' });
    label(ctx, '3 fases', xL, yBase + 118, { color: 'rgba(147,174,201,0.6)', size: 8.5, align: 'center' });

    // interruptor
    const sx = xL + 72;
    const closed = Math.sin(t * 1.1) > -0.15;
    ctx.save();
    ctx.fillStyle = '#152741';
    ctx.beginPath();
    ctx.arc(sx, yBase - 30, 4, 0, Math.PI * 2);
    ctx.arc(sx + 40, yBase - 30, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    line(
      ctx,
      closed
        ? [[sx, yBase - 30], [sx + 40, yBase - 30]]
        : [[sx, yBase - 30], [sx + 36, yBase - 54]],
      closed ? C.teal : C.amber,
      2.6,
      undefined,
      closed ? 8 : 0,
    );
    label(ctx, closed ? 'cerrado' : 'reconexión', sx + 20, yBase - 66, {
      color: closed ? C.teal : C.amber,
      size: 10,
      align: 'center',
    });
    line(ctx, [[sx + 4, yBase - 30], [sx + 4, yBase + 30]], C.steel, 1.4);
    line(ctx, [[sx + 36, yBase - 30], [sx + 36, yBase + 30]], C.steel, 1.4);

    // línea larga con fase
    const lineStart = sx + 44;
    const phasePts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      const x = lineStart + (xR - lineStart) * f;
      const y = yBase - 30 + Math.sin(Math.PI * f) * 26;
      phasePts.push([x, y]);
    }
    line(ctx, phasePts, closed ? C.cyan : 'rgba(143,166,189,0.5)', 2.4, closed ? undefined : [5, 5], closed ? 8 : 0);

    // ondas viajeras por la línea cuando está cerrada
    if (closed) {
      for (let k = 0; k < 3; k++) {
        const f = ((t * 0.35 + k / 3) % 1);
        const x = lineStart + (xR - lineStart) * f;
        const y = yBase - 30 + Math.sin(Math.PI * f) * 26;
        glowDot(ctx, x, y, 2.8, C.cyan, 0.8);
      }
    }

    // oscilógrafo
    const ox = w * 0.52;
    const oy = h - 118;
    const ow = w * 0.43;
    const oh = 86;
    roundRect(ctx, ox, oy, ow, oh, 9, 'rgba(6,16,28,0.9)', 'rgba(56,225,255,0.22)');
    const cols = ['#38e1ff', '#2ee6a8', '#b48cff'];
    for (let i = 0; i <= 120; i++) {
      const xx = ox + 8 + (i / 120) * (ow - 16);
      ctx.save();
      ctx.strokeStyle = 'rgba(148,180,220,0.06)';
      ctx.beginPath();
      ctx.moveTo(xx, oy + 6);
      ctx.lineTo(xx, oy + oh - 6);
      ctx.stroke();
      ctx.restore();
    }
    for (let s = 0; s < 3; s++) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 120; i++) {
        const ph = i * 0.12 + t * 2 + s * 2.1;
        pts.push([ox + 8 + (i / 120) * (ow - 16), oy + oh / 2 + Math.sin(ph) * 24]);
      }
      line(ctx, pts, cols[s], 1.4);
    }
    label(ctx, 'v(t) en el extremo de la línea', ox + 10, oy - 6, { color: C.dim, size: 10 });

    // lectura grande del factor p.u.
    label(ctx, `${fmt(data.Fv, 2)} p.u.`, 20, 30, { color: C.amber, size: 20, weight: 800, mono: true });
    label(ctx, `U_man = ${fmt(data.Us, 1)} kV cresta`, 20, 52, { color: C.ink, size: 11, mono: true });
    label(ctx, `U_soporte = ${fmt(data.UsReq, 1)} kV`, 20, 70, { color: C.teal, size: 11, mono: true });

    // barra de magnitud del soporte requerido
    const barX = w - 74;
    const barTop = 104;
    const barH = 128;
    const ratio = Math.min(1, data.UsReq / 1200);
    roundRect(ctx, barX, barTop, 22, barH, 6, 'rgba(255,255,255,0.06)');
    roundRect(ctx, barX, barTop + barH * (1 - ratio), 22, Math.max(4, barH * ratio), 6, C.orange);
    label(ctx, 'soporte', barX + 11, barTop + barH + 18, { color: C.dim, size: 9, align: 'center' });
    label(ctx, `${fmt(data.UsReq, 0)}`, barX + 11, barTop + barH + 32, { color: C.orange, size: 10, align: 'center', mono: true });
    label(ctx, 'kV', barX + 11, barTop + barH + 44, { color: C.dim, size: 8, align: 'center' });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
