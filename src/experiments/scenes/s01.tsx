import { useCanvas } from '../../lib/hooks';
import { C, arrow, clear, grid, label, line, glowDot, roundRect } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  Um: number;
  UfRms: number;
  UfPeak: number;
}

/** Escena: torre con tres fases, fasores y regla √3 → √2. */
export function Scene01({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.05);

    const baseY = h - 46;
    const topY = 62;
    const cx = w * 0.30;
    const phaseX = [cx - 66, cx, cx + 66];
    const phaseY = [baseY - 168, baseY - 190, baseY - 168];

    // torre
    const towerGrad = ctx.createLinearGradient(cx - 40, 0, cx + 40, 0);
    towerGrad.addColorStop(0, 'rgba(125,147,173,0.15)');
    towerGrad.addColorStop(0.5, 'rgba(160,185,210,0.5)');
    towerGrad.addColorStop(1, 'rgba(125,147,173,0.15)');
    ctx.save();
    ctx.strokeStyle = towerGrad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - 42, baseY);
    ctx.lineTo(cx - 9, topY);
    ctx.moveTo(cx + 42, baseY);
    ctx.lineTo(cx + 9, topY);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const f0 = i / 8;
      const f1 = (i + 1) / 8;
      const y0 = baseY - f0 * (baseY - topY);
      const y1 = baseY - f1 * (baseY - topY);
      const w0 = 42 - 33 * f0;
      const w1 = 42 - 33 * f1;
      ctx.strokeStyle = 'rgba(150,175,200,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - w1, y1);
      ctx.lineTo(cx + w0, y0);
      ctx.moveTo(cx + w1, y1);
      ctx.lineTo(cx - w0, y0);
      ctx.stroke();
    }
    ctx.restore();

    // crucetas
    line(ctx, [[cx - 86, phaseY[0]], [cx + 86, phaseY[0]]], '#93a9c0', 3);
    line(ctx, [[cx - 86, phaseY[1] - 24], [cx + 86, phaseY[1] - 24]], '#93a9c0', 3);

    // fases
    phaseX.forEach((px, i) => {
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + i * 1.9));
      const phY = phaseY[i];
      // aisladores
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.fillStyle = `rgba(200,215,232,${0.55 + 0.35 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(px, phY + 16 + k * 9, 8, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      glowDot(ctx, px, phY, 5.5, i === 1 ? C.amber : C.cyan, 0.55 + 0.45 * pulse);
      label(ctx, ['A', 'B', 'C'][i], px, phY - 14, {
        color: i === 1 ? C.amber : C.cyan,
        size: 11,
        align: 'center',
        mono: true,
      });
      if (i === 1) {
        label(ctx, `fase–tierra: ${fmt(data.UfPeak, 1)} kV cresta`, px, baseY + 26, {
          color: 'rgba(231,240,251,0.82)',
          size: 10.5,
          align: 'center',
          mono: true,
        });
      }
    });

    // fasores a la derecha
    const fx = w * 0.66;
    const fy = h * 0.44;
    const R = Math.min(84, h * 0.30);
    ctx.save();
    ctx.strokeStyle = 'rgba(148,180,220,0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(fx, fy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(148,180,220,0.18)';
    ctx.beginPath();
    ctx.moveTo(fx - R - 8, fy);
    ctx.lineTo(fx + R + 8, fy);
    ctx.moveTo(fx, fy - R - 8);
    ctx.lineTo(fx, fy + R + 8);
    ctx.stroke();
    ctx.restore();

    const angs = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI) / 3, -Math.PI / 2 - (2 * Math.PI) / 3];
    angs.forEach((ang, i) => {
      const rot = ang;
      const ex = fx + Math.cos(rot) * R;
      const ey = fy + Math.sin(rot) * R;
      const col = i === 0 ? C.amber : i === 1 ? C.cyan : C.violet;
      arrow(ctx, fx, fy, ex, ey, col, i === 0 ? 2.4 : 1.6);
      label(ctx, ['Uₘ', 'U_f', 'U_f'][i] ?? '', ex + Math.cos(rot) * 12, ey + Math.sin(rot) * 12 + 4, {
        color: col,
        size: 10,
        align: 'center',
        mono: true,
      });
    });
    label(ctx, 'Uₘ entre fases · U_f fase–tierra', fx, fy + R + 32, {
      color: C.dim,
      size: 10.5,
      align: 'center',
    });

    // tarjeta de conversión
    const bx = w * 0.60;
    const by = h - 96;
    roundRect(ctx, bx, by, w * 0.35, 66, 10, 'rgba(10,22,36,0.82)', 'rgba(56,225,255,0.25)');
    label(ctx, 'U_f = Uₘ / √3', bx + 14, by + 24, { color: C.teal, size: 12, mono: true, weight: 600 });
    label(ctx, `= ${fmt(data.UfRms, 1)} kV`, bx + 130, by + 24, { color: C.ink, size: 12, mono: true });
    label(ctx, 'Û_f = √2 · U_f', bx + 14, by + 46, { color: C.amber, size: 12, mono: true, weight: 600 });
    label(ctx, `= ${fmt(data.UfPeak, 1)} kV`, bx + 130, by + 46, { color: C.ink, size: 12, mono: true });

    label(ctx, `Uₘ = ${fmt(data.Um, 1)} kV`, 14, 22, { color: C.dim, size: 11, mono: true });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
