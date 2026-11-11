import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, lightning, gauge, checkMark, crossMark } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  current: number;
  Rt: number;
  Vt: number;
  flashover: boolean;
  margin: number;
}

/** Escena: torre golpeada por rayo, corriente al suelo y potencial. */
export function Scene10({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const baseY = h - 78;
    const cx = w * 0.32;
    const scale = (h - 160) / 11;

    // torre
    const topY = baseY - 10 * scale;
    line(ctx, [[cx - 46, baseY], [cx - 12, topY], [cx + 12, topY], [cx + 46, baseY]], '#8ea6bd', 3);
    for (let i = 0; i < 8; i++) {
      const f0 = i / 8;
      const f1 = (i + 1) / 8;
      const y0 = baseY - f0 * (baseY - topY);
      const y1 = baseY - f1 * (baseY - topY);
      const w0 = 46 - 34 * f0;
      const w1 = 46 - 34 * f1;
      line(ctx, [[cx - w1, y1], [cx + w0, y0]], 'rgba(160,190,215,0.35)', 1);
      line(ctx, [[cx + w1, y1], [cx - w0, y0]], 'rgba(160,190,215,0.35)', 1);
    }
    line(ctx, [[cx - 82, topY + 18], [cx + 82, topY + 18]], '#93a9c0', 3);

    // guarda y fase
    line(ctx, [[cx - 82, topY + 6], [cx + 110, topY + 6]], C.violet, 2);
    label(ctx, 'guarda', cx + 114, topY + 10, { color: C.violet, size: 9 });
    line(ctx, [[cx + 78, topY + 18], [cx + 90, topY + 18]], C.steel, 2);
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.fillStyle = 'rgba(196,212,230,0.9)';
      ctx.beginPath();
      ctx.ellipse(cx + 84, topY + 22 + i * 6, 8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    line(ctx, [[cx + 78, topY + 58], [cx + 130, topY + 58]], C.cyan, 2.2, undefined, 8);
    label(ctx, 'fase', cx + 134, topY + 62, { color: C.cyan, size: 9 });

    // rayo
    const flash = (t * 0.5) % 1 < 0.45;
    if (flash) {
      lightning(ctx, cx + 6, 6, cx, topY + 4, 3, '#e8f5ff', 2.4);
      glowDot(ctx, cx, topY + 6, 7, C.cyan, 0.7);
    }
    label(ctx, `${fmt(data.current, 0)} kA`, cx + 14, 26, { color: C.cyan, size: 12, mono: true, weight: 700 });

    // electrodos de tierra
    const gx = cx;
    line(ctx, [[0, baseY], [w, baseY]], 'rgba(160,200,235,0.35)', 1.6);
    ctx.save();
    const gg = ctx.createLinearGradient(0, baseY, 0, h);
    gg.addColorStop(0, 'rgba(46,230,168,0.12)');
    gg.addColorStop(1, 'rgba(46,230,168,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(0, baseY, w, h - baseY);
    ctx.restore();
    for (let i = 0; i < 5; i++) {
      const x = gx - 60 + i * 30;
      line(ctx, [[x, baseY], [x, baseY + 20]], C.teal, 2, undefined, 5);
    }
    line(ctx, [[gx - 62, baseY], [gx + 62, baseY]], C.teal, 2);
    label(ctx, `R_t = ${fmt(data.Rt, 1)} Ω`, gx, baseY + 36, { color: C.teal, size: 10, align: 'center', mono: true });

    // líneas de potencial
    for (let i = 1; i <= 4; i++) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,92,108,${0.10 * (1 - i / 5)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(gx, baseY, i * 26, i * 9, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // medidor de potencial
    const gxc = w * 0.72;
    const gyc = 150;
    gauge(ctx, gxc, gyc, 62, Math.min(1, data.Vt / 1200), data.flashover ? C.red : C.teal, `${fmt(data.Vt, 0)}`, 'kV en torre');
    label(ctx, 'U cadena = 700 kV', gxc, gyc + 28, { color: C.dim, size: 9, align: 'center' });

    // tarjeta de estado
    const by = gyc + 52;
    roundRect(ctx, w * 0.56, by, w * 0.40, 96, 10, 'rgba(9,20,33,0.86)', 'rgba(148,180,220,0.18)');
    label(ctx, 'V_t = I·R_t + L·di/dt', w * 0.56 + 14, by + 22, { color: C.dim, size: 9.5, mono: true });
    label(ctx, `${fmt(data.Vt, 1)} kV`, w * 0.56 + 14, by + 48, {
      color: data.flashover ? C.red : C.teal,
      size: 20,
      mono: true,
      weight: 700,
    });
    if (data.flashover) {
      crossMark(ctx, w * 0.56 + 20, by + 70, 12, C.red, 2.2);
      label(ctx, 'flameo inverso', w * 0.56 + 36, by + 75, { color: C.red, size: 11, weight: 700 });
    } else {
      checkMark(ctx, w * 0.56 + 20, by + 69, 13, C.teal, 2.4);
      label(ctx, 'sin flameo', w * 0.56 + 36, by + 75, { color: C.teal, size: 11, weight: 700 });
    }

    // corriente baja por la torre animada
    for (let i = 0; i < 5; i++) {
      const f = ((t * 0.8 + i / 5) % 1);
      const py = topY + f * (baseY - topY);
      glowDot(ctx, cx + Math.sin(f * 6) * 3, py, 2.6, C.cyan, 0.75 * (1 - f * 0.5));
    }
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
