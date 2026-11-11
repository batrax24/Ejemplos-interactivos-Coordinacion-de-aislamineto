import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, latticeTower, checkMark, crossMark } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  Um: number;
  alt: number;
  nFinal: number;
  chainLength: number;
  Ures: number;
  bil: number;
  margin: number;
  ok: boolean;
  delta: number;
  Upeak: number;
}

/** Escena: tablero de misión con torre, cadena y tres indicadores. */
export function Scene14({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.05);

    // torre pequeña a la izquierda
    const baseY = h - 52;
    const nDraw = Math.min(18, data.nFinal);
    const cx = w * 0.19;
    const towerH = Math.min(h - 96, 300);
    latticeTower(ctx, cx, baseY, towerH, { width: 40, color: '#8ea6bd', alpha: 0.8 });
    line(ctx, [[cx - 64, baseY - towerH + 18], [cx + 64, baseY - towerH + 18]], '#93a9c0', 3);
    const chainPx = Math.min(baseY - 26 - (baseY - towerH + 18), data.chainLength * 30);
    line(ctx, [[cx - 58, baseY - towerH + 18], [cx - 58, baseY - towerH + 18 + chainPx]], 'rgba(180,200,220,0.4)', 1);
    const chainDrawn = Math.min(18, data.nFinal);
    for (let i = 0; i < chainDrawn; i++) {
      ctx.save();
      ctx.fillStyle = 'rgba(196,212,230,0.9)';
      ctx.beginPath();
      ctx.ellipse(cx - 58, baseY - towerH + 22 + i * (chainPx / nDraw), 8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    glowDot(ctx, cx - 58, baseY - towerH + 18 + chainPx, 4, C.cyan, 0.8);
    label(ctx, `${data.nFinal} discos`, cx, baseY + 18, { color: C.cyan, size: 9.5, align: 'center', mono: true });

    // halo de altitud
    label(ctx, `${fmt(data.alt, 0)} m · δ ${fmt(data.delta, 2)}`, cx, 26, { color: C.dim, size: 9.5, align: 'center' });

    // tres indicadores
    const bx = w * 0.40;
    const bw = w - bx - 20;
    const items = [
      {
        name: 'Cadena',
        value: `${data.nFinal} discos`,
        ok: data.nFinal >= 21,
        sub: `L_c = ${fmt(data.chainLength, 2)} m`,
        frac: Math.min(1, data.nFinal / 30),
      },
      {
        name: 'Margen de equipo',
        value: `${fmt(data.margin, 1)} %`,
        ok: data.margin >= 20,
        sub: `BIL ${fmt(data.bil, 0)} / U_res ${fmt(data.Ures, 0)}`,
        frac: Math.min(1, Math.max(0, data.margin) / 60),
      },
      {
        name: 'Residual vs fase',
        value: data.Ures > data.Upeak ? 'ok' : 'falla',
        ok: data.Ures > data.Upeak,
        sub: `${fmt(data.Ures, 0)} > ${fmt(data.Upeak, 0)} kV`,
        frac: Math.min(1, data.Ures / Math.max(1, data.Upeak) / 1.5),
      },
    ];
    items.forEach((it, i) => {
      const yy = 42 + i * 74;
      roundRect(ctx, bx, yy, bw, 62, 10, 'rgba(9,20,33,0.86)', it.ok ? 'rgba(46,230,168,0.45)' : 'rgba(255,92,108,0.45)', 1.3);
      label(ctx, it.name.toUpperCase(), bx + 14, yy + 20, { color: C.dim, size: 8, weight: 700 });
      label(ctx, it.value, bx + 14, yy + 42, { color: it.ok ? C.teal : C.red, size: 17, mono: true, weight: 700 });
      label(ctx, it.sub, bx + bw - 14, yy + 42, { color: C.dim, size: 9, align: 'right', mono: true });
      roundRect(ctx, bx + 14, yy + 50, bw - 28, 4, 2, 'rgba(255,255,255,0.07)');
      roundRect(ctx, bx + 14, yy + 50, (bw - 28) * it.frac, 4, 2, it.ok ? C.teal : C.red);
    });

    // banner de estado
    const by = 42 + 3 * 74 + 10;
    if (by < h - 30) {
      roundRect(ctx, bx, by, bw, 46, 10, data.ok ? 'rgba(46,230,168,0.13)' : 'rgba(255,138,61,0.13)', data.ok ? C.teal : C.orange);
      if (data.ok) checkMark(ctx, bx + 28, by + 20, 15, C.teal, 2.6);
      else crossMark(ctx, bx + 28, by + 20, 13, C.orange, 2.4);
      label(ctx, data.ok ? 'PROYECTO COORDINADO' : 'CRITERIOS PENDIENTES', bx + 46, by + 24, {
        color: data.ok ? C.teal : C.orange,
        size: 12,
        align: 'left',
        weight: 800,
      });
      label(ctx, `${fmt(data.Um, 0)} kV`, bx + bw / 2, by + 38, { color: C.dim, size: 9, align: 'center', mono: true });
    }

    // pista animada
    for (let i = 0; i < 6; i++) {
      const f = (t * 0.5 + i / 6) % 1;
      glowDot(ctx, cx + 50 + f * (bx - cx - 70), h - 40, 2, 'rgba(56,225,255,0.5)', 0.5);
    }
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
