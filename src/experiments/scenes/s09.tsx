import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, arrow, latticeTower, lightning } from '../../lib/draw';
import { fmt, rad } from '../../lib/num';

interface Data {
  dh: number;
  dx: number;
  alpha: number;
  strikeDistance: number;
  protectedWidth: number;
}

/** Escena: torre con guarda, fase, cono de apantallamiento y rayo. */
export function Scene09({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const baseY = h - 76;
    const cx = w * 0.44;
    const scale = (h - 190) / 13;

    // torre
    latticeTower(ctx, cx, baseY, 12.6 * scale, { width: 46, color: '#8ea6bd', alpha: 0.85 });
    const groundY = baseY;
    line(ctx, [[0, groundY], [w, groundY]], 'rgba(160,200,235,0.35)', 1.6);

    // guarda y fase
    const gx = cx + 26;
    const gyTop = baseY - 13 * scale;
    const fy = gyTop + data.dh * scale;
    const fx = gx + data.dx * scale;
    // la fase se dibuja a la derecha y la guarda sobre la torre: alinea el ángulo con el esquema
    const guardaX = cx + 6;

    line(ctx, [[cx, gyTop], [gx, gyTop]], '#93a9c0', 3);
    void guardaX;
    line(ctx, [[cx, fy], [fx, fy]], '#93a9c0', 2.2);

    // guarda
    const gpts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const f = i / 24;
      gpts.push([gx - 60 + f * (w - gx + 40), gyTop + Math.sin(Math.PI * f) * 8]);
    }
    line(ctx, gpts, C.violet, 2.2, undefined, 8);
    label(ctx, 'cable de guarda', gx - 60, gyTop - 12, { color: C.violet, size: 9.5, mono: true });

    // fase
    const fpts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const f = i / 24;
      fpts.push([fx - 40 + f * (w - fx + 10), fy + 14 + Math.sin(Math.PI * f) * 12]);
    }
    line(ctx, fpts, C.cyan, 2.6, undefined, 10);
    glowDot(ctx, fx, fy + 14, 4.4, C.cyan, 0.9);
    label(ctx, 'fase', fx + 8, fy + 6, { color: C.cyan, size: 9.5, mono: true });

    // cadena
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.fillStyle = 'rgba(196,212,230,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx + 26 + (data.dx * scale) / 2, fy + 4 + i * 5, 8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ángulo
    const aRad = rad(data.alpha);
    line(ctx, [[gx, gyTop], [gx, fy + 10]], 'rgba(148,180,220,0.55)', 1.4, [5, 4]);
    line(ctx, [[gx, gyTop], [fx, fy]], C.amber, 1.6);
    ctx.save();
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gx, gyTop, Math.abs(data.alpha) < 4 ? 26 : Math.max(20, Math.abs(Math.atan2(data.dx, data.dh)) * 60), Math.PI / 2 - aRad, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, `α = ${fmt(data.alpha, 1)}°`, gx + 24, gyTop + 26, { color: C.amber, size: 10, mono: true });

    // cotas
    line(ctx, [[gx, gyTop], [fx, gyTop]], 'rgba(148,180,220,0.5)', 1.2, [4, 4]);
    arrow(ctx, Math.min(gx, fx) - 16, gyTop, Math.min(gx, fx) - 16, fy, C.teal, 1.3, true);
    label(ctx, `Δh ${fmt(data.dh, 1)} m`, Math.min(gx, fx) - 20, (gyTop + fy) / 2, {
      color: C.teal,
      size: 9,
      align: 'right',
      mono: true,
    });
    arrow(ctx, gx, fy - 12, fx, fy - 12, C.violet, 1.3, true);
    label(ctx, `Δx ${fmt(data.dx, 1)} m`, (gx + fx) / 2, fy - 18, { color: C.violet, size: 9, align: 'center', mono: true });

    // radio de atracción (círculo)
    const R = Math.min(data.strikeDistance * scale * 0.42, Math.max(64, h * 0.3));
    ctx.save();
    ctx.strokeStyle = 'rgba(180,140,255,0.35)';
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(gx, gyTop, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, `R_s ≈ ${fmt(data.strikeDistance, 0)} m`, gx + R * 0.62, gyTop + R * 0.78, {
      color: 'rgba(180,140,255,0.85)',
      size: 9,
      mono: true,
      align: 'center',
      bg: 'rgba(6,12,20,0.7)',
    });

    // rayo periódico
    const cycle = (t * 0.45) % 1;
    if (cycle < 0.5) {
      const lx = gx + Math.sin(Math.floor(t * 0.45) * 3.1) * 30 * (data.dx > 0 ? 1 : -1);
      lightning(ctx, lx, 8, gx, gyTop - 4, Math.floor(t * 0.45) + 1, '#dff0ff', 2.2);
      glowDot(ctx, gx, gyTop, 6, C.cyan, 0.6 * (1 - cycle * 2));
    }
    label(ctx, 'nube de tormenta', 16, 22, { color: 'rgba(200,225,255,0.75)', size: 9.5 });

    // leyenda de estado (compacta, fuera de la geometría)
    const bx = 14;
    const by = h - 62;
    const bw = w - 28;
    roundRect(ctx, bx, by, bw, 48, 10, 'rgba(9,20,33,0.88)', 'rgba(148,180,220,0.18)');
    label(ctx, 'sombra por lado', bx + 14, by + 18, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.protectedWidth, 1)} m`, bx + 14, by + 37, { color: C.teal, size: 13, mono: true, weight: 700 });
    label(ctx, 'ángulo α', bx + bw * 0.34, by + 18, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.alpha, 1)}°`, bx + bw * 0.34, by + 37, { color: C.amber, size: 13, mono: true, weight: 700 });
    label(ctx, 'radio de atracción', bx + bw * 0.62, by + 18, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.strikeDistance, 0)} m`, bx + bw * 0.62, by + 37, { color: C.violet, size: 13, mono: true, weight: 700 });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
