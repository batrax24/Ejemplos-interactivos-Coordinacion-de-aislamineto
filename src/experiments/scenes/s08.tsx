import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, arrow } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  D: number;
  F: number;
  L: number;
  term1: number;
  term2: number;
  Vn: number;
}

/** Escena: tres fases vistas de frente con separación D a escala. */
export function Scene08({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const scale = Math.min((w - 120) / 14, (h - 150) / 9);
    const cx = w / 2;
    const D = Math.max(0.4, Math.min(data.D, 14));
    const gap = D * scale;

    // estructura
    line(ctx, [[cx - gap * 1.5 - 30, h * 0.20], [cx + gap * 1.5 + 30, h * 0.20]], '#93a9c0', 5);
    line(ctx, [[cx, h * 0.20], [cx, h * 0.20 - 40]], '#93a9c0', 4);
    label(ctx, 'cruceta', cx, h * 0.20 - 46, { color: C.dim, size: 9, align: 'center' });

    const cols = [C.cyan, C.amber, C.violet];
    const names = ['A', 'B', 'C'];
    const xs = [cx - gap, cx, cx + gap];
    xs.forEach((x, i) => {
      // cadena
      const chainTop = h * 0.20;
      const chainBot = chainTop + data.L * scale * 0.55;
      line(ctx, [[x, chainTop], [x, chainBot]], 'rgba(180,200,220,0.45)', 1.2);
      for (let k = 0; k < 7; k++) {
        const cy = chainTop + 6 + (k / 7) * (chainBot - chainTop - 8);
        ctx.save();
        ctx.fillStyle = 'rgba(196,212,230,0.9)';
        ctx.beginPath();
        ctx.ellipse(x, cy, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // conductor con flecha
      const cpts: [number, number][] = [];
      for (let k = 0; k <= 26; k++) {
        const f = k / 26;
        cpts.push([x - gap * 1.15 + f * gap * 2.3, chainBot + 8 + Math.sin(Math.PI * f) * data.F * scale * 0.10]);
      }
      line(ctx, cpts, cols[i], 2.4, undefined, 9);
      glowDot(ctx, x, chainBot, 4.2, cols[i], 0.6 + 0.4 * Math.abs(Math.sin(t * 1.4 + i)));
      label(ctx, names[i], x, chainTop - 10, { color: cols[i], size: 11, align: 'center', mono: true, weight: 700 });
    });

    // cota entre fases
    const cotaY = h * 0.74;
    line(ctx, [[cx - gap, cotaY], [cx + gap, cotaY]], C.teal, 1.8);
    line(ctx, [[cx - gap, cotaY - 6], [cx - gap, cotaY + 6]], C.teal, 1.8);
    line(ctx, [[cx + gap, cotaY - 6], [cx + gap, cotaY + 6]], C.teal, 1.8);
    label(ctx, `D = ${fmt(data.D, 2)} m`, cx, cotaY - 8, { color: C.teal, size: 13, align: 'center', mono: true, weight: 700 });

    // cotas verticales a los lados, fuera de los conductores
    const chainLen = data.L * scale * 0.55;
    const sagPx = data.F * scale * 0.10;
    const lx = cx + gap + 34;
    const rx = cx - gap - 34;
    arrow(ctx, lx, h * 0.20, lx, h * 0.20 + chainLen, C.violet, 1.4, true);
    label(ctx, `L = ${fmt(data.L, 2)} m`, lx + 7, h * 0.20 + chainLen * 0.5, { color: C.violet, size: 9.5, mono: true });
    const fy0 = h * 0.20 + chainLen;
    arrow(ctx, rx, fy0, rx, fy0 + sagPx, C.steel, 1.4, true);
    label(ctx, `F = ${fmt(data.F, 1)} m`, rx - 7, fy0 + sagPx * 0.5 + 4, { color: C.steel, size: 9.5, mono: true, align: 'right' });

    // desglose
    const bx = 16;
    const by = h - 76;
    roundRect(ctx, bx, by, w - 32, 60, 10, 'rgba(9,20,33,0.85)', 'rgba(148,180,220,0.18)');
    label(ctx, 'término geométrico', bx + 14, by + 20, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.term1, 2)} m`, bx + 14, by + 42, { color: C.cyan, size: 15, mono: true, weight: 700 });
    label(ctx, 'término eléctrico', bx + w * 0.36, by + 20, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.term2, 2)} m`, bx + w * 0.36, by + 42, { color: C.violet, size: 15, mono: true, weight: 700 });
    label(ctx, 'separación total', bx + w * 0.68, by + 20, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.D, 2)} m`, bx + w * 0.68, by + 42, { color: C.teal, size: 15, mono: true, weight: 700 });
    label(ctx, `Vₙ = ${fmt(data.Vn, 0)} kV`, w - 30, 24, { color: C.dim, size: 10, align: 'right', mono: true });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
