import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, insulatorDisc, glowDot } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  n: number;
  chainLength: number;
  lfReq: number;
  lfReal: number;
  pitch: number;
  Um: number;
}

/** Escena: cadena colgante de discos con longitud y fuga en vivo. */
export function Scene06({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const topY = 34;
    const availH = h - topY - 46;
    const cx = w * 0.30;
    const discStep = Math.min(15, (availH * 0.94) / Math.max(1, data.n));
    const shownLen = discStep * Math.max(1, data.n);

    // cruceta
    line(ctx, [[cx - 90, topY], [cx + 90, topY]], '#93a9c0', 5);
    line(ctx, [[cx - 90, topY], [cx - 90, topY + 26]], 'rgba(160,190,215,0.5)', 1.4);
    line(ctx, [[cx + 90, topY], [cx + 90, topY + 26]], 'rgba(160,190,215,0.5)', 1.4);
    label(ctx, 'cruceta (a tierra)', cx - 90, topY + 40, { color: C.dim, size: 9, align: 'center' });

    // cadena
    ctx.save();
    ctx.strokeStyle = 'rgba(185,205,225,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, topY + shownLen);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < data.n; i++) {
      const cy = topY + discStep * (i + 0.5);
      if (cy > h - 16) break;
      const ry = Math.max(1.6, Math.min(5, discStep * 0.44));
      const energize = 0.12 + 0.1 * Math.sin(t * 2 - i * 0.3);
      insulatorDisc(ctx, cx, cy, Math.min(18, 10 + discStep * 0.3), ry, '#c6d5e6', energize);
    }

    // conductor en el extremo
    const endY = topY + shownLen;
    glowDot(ctx, cx, endY + 6, 4.4, C.cyan, 0.85);
    const sag = 12;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 20; i++) {
      const f = i / 20;
      pts.push([cx - 90 + f * 180, endY + 8 + sag * Math.sin(Math.PI * f)]);
    }
    line(ctx, pts, C.cyan, 2.4, undefined, 9);
    label(ctx, 'conductor', cx + 96, endY + 12, { color: C.cyan, size: 9 });

    // cota de fuga
    const rx = cx + 48;
    line(ctx, [[cx + 12, topY + 2], [rx + 8, topY + 2]], C.violet, 1.2, [4, 3]);
    line(ctx, [[rx, topY], [rx, endY]], C.violet, 1.6);
    line(ctx, [[rx - 6, topY], [rx + 6, topY]], C.violet, 1.6);
    line(ctx, [[rx - 6, endY], [rx + 6, endY]], C.violet, 1.6);
    label(ctx, `${fmt(data.chainLength, 3)} m`, rx + 12, (topY + endY) / 2, { color: C.violet, size: 11, mono: true });
    label(ctx, `${data.n} discos`, rx + 12, (topY + endY) / 2 + 16, { color: C.dim, size: 9.5 });

    // tarjeta de cálculo derecha
    const bx = w * 0.55;
    const by = 62;
    const bw = w - bx - 20;
    roundRect(ctx, bx, by, bw, 150, 12, 'rgba(9,20,33,0.88)', 'rgba(56,225,255,0.22)');

    label(ctx, 'DISTANCIA DE FUGA', bx + 14, by + 22, { color: C.cyan, size: 8.5, weight: 700 });
    label(ctx, `${fmt(data.lfReq, 0)} mm req.`, bx + 14, by + 46, { color: C.ink, size: 15, mono: true, weight: 600 });
    label(ctx, `${fmt(data.lfReal, 0)} mm real`, bx + 14, by + 66, { color: C.teal, size: 12, mono: true });

    // barra proporcional
    const barW = bw - 28;
    const frac = Math.min(1, data.lfReal / (data.lfReq * 1.3 || 1));
    const reqFrac = Math.min(1, data.lfReq / (data.lfReq * 1.3 || 1));
    roundRect(ctx, bx + 14, by + 78, barW, 10, 5, 'rgba(255,255,255,0.07)');
    roundRect(ctx, bx + 14, by + 78, barW * frac, 10, 5, C.teal);
    line(ctx, [[bx + 14 + barW * reqFrac, by + 74], [bx + 14 + barW * reqFrac, by + 92]], C.amber, 2);
    label(ctx, 'requerido', bx + 14 + barW * reqFrac, by + 104, { color: C.amber, size: 8.5, align: 'center' });

    label(ctx, `Uₘ = ${fmt(data.Um, 1)} kV`, bx + 14, by + 126, { color: C.dim, size: 10, mono: true });
    label(ctx, `paso ${fmt(data.pitch, 3)} m`, bx + bw - 14, by + 126, { color: C.dim, size: 10, mono: true, align: 'right' });

    // halo de contaminación
    const ha = 0.1 + 0.06 * Math.sin(t);
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const py = topY + (i / 16) * shownLen;
      ctx.globalAlpha = ha;
      ctx.fillStyle = C.amber;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(i * 3.1 + t * 0.8) * 14, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    label(ctx, 'contaminación', cx - 62, topY + shownLen * 0.55, { color: 'rgba(255,194,71,0.55)', size: 8.5, align: 'right' });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
