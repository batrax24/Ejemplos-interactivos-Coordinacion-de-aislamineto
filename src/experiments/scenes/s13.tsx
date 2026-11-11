import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, bar } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  f: number;
  delta: number;
  r: number;
  s: number;
  U: number;
  U0: number;
  root: number;
  diff: number;
  P: number;
  gradient: number;
  surfaceField: number;
  bundleEq: number;
  critical: number;
  active: boolean;
  bundle?: number;
}

/** Escena: conductor con halo de corona y banco de pérdidas. */
export function Scene13({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const cx = w / 2;
    const cy = h * 0.46;
    const radius = Math.min(30, 6 + data.r * 6);

    // conductor
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
    g.addColorStop(0, '#cfe2f4');
    g.addColorStop(0.5, '#8ea6bd');
    g.addColorStop(1, '#4f6379');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(w * 0.09, cy - radius, w * 0.82, radius * 2, radius);
    ctx.fill();
    ctx.restore();
    label(ctx, 'conductor', w * 0.09, cy - radius - 8, { color: C.dim, size: 9 });

    // halo corona
    const intensity = data.active ? Math.min(1, data.P / 14) : 0;
    if (intensity > 0.01) {
      ctx.save();
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 3.4);
      halo.addColorStop(0, `rgba(180,140,255,${0.30 * intensity})`);
      halo.addColorStop(0.5, `rgba(120,190,255,${0.14 * intensity})`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(w * 0.09, cy - radius * 4, w * 0.82, radius * 8);
      ctx.restore();

      for (let i = 0; i < 22; i++) {
        const px = w * 0.11 + ((i * 97 + t * 30 * (0.5 + (i % 4) / 5)) % (w * 0.78));
        const ang = (i * 2.3 + t * 3) % (Math.PI * 2);
        const d = radius + 4 + Math.abs(Math.sin(t * 2 + i)) * radius * 1.8;
        glowDot(ctx, px, cy + Math.sin(ang) * d, 1.8 + intensity, C.violet, 0.35 + 0.3 * intensity);
      }
    }
    // chispas puntuales en la superficie
    if (data.active) {
      for (let i = 0; i < 6; i++) {
        const px = w * 0.18 + i * (w * 0.12);
        const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 5 + i * 1.7));
        ctx.save();
        ctx.globalAlpha = a * intensity;
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, cy - radius);
        ctx.lineTo(px + 3, cy - radius - 7);
        ctx.stroke();
        ctx.restore();
      }
    }

    // comparación de radio equivalente (haz)
    void 0;
    // medidor de gradiente
    const gx = w - 84;
    const gy = 42;
    roundRect(ctx, gx - 14, gy, 84, 92, 10, 'rgba(9,20,33,0.85)', 'rgba(180,140,255,0.3)');
    label(ctx, 'gradiente', gx, gy + 18, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.surfaceField, 1)}`, gx, gy + 46, {
      color: data.surfaceField > 20 ? C.red : C.teal,
      size: 20,
      mono: true,
      weight: 700,
    });
    label(ctx, 'kV/cm', gx, gy + 64, { color: C.dim, size: 8.5 });

    // banco de pérdidas
    const bx = 20;
    const by = h - 112;
    const bw = w - 40;
    roundRect(ctx, bx, by, bw, 94, 10, 'rgba(9,20,33,0.88)', 'rgba(148,180,220,0.18)');
    label(ctx, 'PÉRDIDAS POR CORONA', bx + 14, by + 20, { color: C.dim, size: 8.5, weight: 700 });
    label(ctx, `${fmt(data.P, 2)} kW/km`, bx + 14, by + 48, {
      color: data.P > 8 ? C.red : data.P > 3 ? C.amber : C.teal,
      size: 22,
      mono: true,
      weight: 700,
    });
    const barsX = bx + bw * 0.55;
    for (let i = 0; i < 3; i++) {
      const frac = i === 0 ? data.P / 20 : i === 1 ? data.U / 500 : i === 2 ? data.delta : 0;
      bar(ctx, barsX + i * 28, by + 74, 14, 46, frac, [C.orange, C.cyan, C.teal][i], 3);
      label(ctx, ['P', 'U', 'δ'][i], barsX + i * 28 + 7, by + 88, { color: C.dim, size: 8, align: 'center', mono: true });
    }
    label(ctx, data.active ? 'corona activa' : 'sin corona', bx + bw - 14, by + 22, {
      color: data.active ? C.orange : C.teal,
      size: 10,
      weight: 700,
      align: 'right',
    });
    label(ctx, `U = ${fmt(data.U, 0)} kV · U₀ = ${fmt(data.U0, 0)} kV`, bx + bw - 14, by + 40, {
      color: C.dim,
      size: 9,
      align: 'right',
      mono: true,
    });

    // comparación haz
    if ((data.bundle ?? 1) > 1) {
      label(ctx, `haz de ${data.bundle ?? 1} subconductores`, cx, cy + radius * 6, { color: C.violet, size: 9.5, align: 'center' });
      for (let k = 0; k < (data.bundle ?? 1); k++) {
        const px = cx - 30 + k * (60 / Math.max(1, (data.bundle ?? 1) - 1));
        glowDot(ctx, px, cy + radius * 4.6, 4.4, C.violet, 0.75);
      }
    }

    line(ctx, [[w * 0.2, cy - radius - 26], [w * 0.7, cy - radius - 26]], 'rgba(148,180,220,0.2)', 1, [4, 4]);
    label(ctx, `r = ${fmt(data.r, 2)} cm`, w * 0.7, cy - radius - 30, { color: C.dim, size: 9, align: 'right' });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
