import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, arrow, latticeTower, checkMark, crossMark } from '../../lib/draw';
import { fmt, rad } from '../../lib/num';

interface Data {
  L: number;
  theta: number;
  d0: number;
  dh: number;
  required: number;
  ok: boolean;
}

/** Escena: torre con cadena inclinada por viento y cota de distancia. */
export function Scene07({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const scale = Math.min((w * 0.36) / 7, (h - 108) / 7);
    const originX = w * 0.44;
    const originY = 62;
    const toX = (m: number) => originX + m * scale;
    const toY = (m: number) => originY + m * scale;

    // terreno
    line(ctx, [[0, toY(5.4)], [w, toY(5.4)]], 'rgba(160,200,235,0.28)', 1.4);
    for (let gx2 = 8; gx2 < w; gx2 += 16) {
      line(ctx, [[gx2, toY(5.4)], [gx2 - 7, toY(5.4) + 8]], 'rgba(148,180,210,0.22)', 1);
    }

    // torre
    latticeTower(ctx, originX - 6, toY(5.4), 5.4 * scale, { width: 54, color: '#8ea6bd', alpha: 0.9 });
    line(ctx, [[originX - 34, originY], [originX + 26, originY]], '#93a9c0', 4);
    label(ctx, 'estructura a tierra', originX - 6, toY(5.6), { color: C.dim, size: 9, align: 'center' });

    // punto de suspensión
    const suspX = originX + 2;
    const suspY = originY + 18;
    glowDot(ctx, suspX, suspY, 3, C.steel, 1);

    const th = rad(data.theta);
    const chainPx = data.L * scale;
    const endX = suspX + Math.sin(th) * chainPx;
    const endY = suspY + Math.cos(th) * chainPx;

    // viento
    const windAlpha = Math.min(1, data.theta / 30);
    for (let i = 0; i < 5; i++) {
      const wy = originY + 10 + i * 16;
      const off = ((t * 90 + i * 40) % (w * 0.5)) - w * 0.16;
      ctx.save();
      ctx.globalAlpha = 0.16 + 0.22 * windAlpha;
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(off, wy);
      ctx.lineTo(off + 26 + 22 * windAlpha, wy);
      ctx.stroke();
      ctx.restore();
    }
    label(ctx, `viento · θ = ${fmt(data.theta, 1)}°`, 18, h - 18, { color: C.cyan, size: 10 });

    // cadena de discos inclinada
    const nDisc = 12;
    for (let i = 0; i < nDisc; i++) {
      const f = (i + 0.5) / nDisc;
      const dxp = suspX + Math.sin(th) * chainPx * f;
      const dyp = suspY + Math.cos(th) * chainPx * f;
      ctx.save();
      ctx.translate(dxp, dyp);
      ctx.rotate(-th);
      ctx.fillStyle = 'rgba(196,212,230,0.92)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    line(ctx, [[suspX, suspY], [endX, endY]], 'rgba(180,200,220,0.5)', 1.2);

    // conductor hacia la derecha
    const pts: [number, number][] = [];
    for (let i = 0; i <= 22; i++) {
      const f = i / 22;
      pts.push([endX + f * (w - endX - 10), endY + Math.sin(Math.PI * f) * 16]);
    }
    line(ctx, pts, C.cyan, 2.6, undefined, 10);
    glowDot(ctx, endX, endY, 4, C.cyan, 0.9);

    // línea vertical de referencia (posición en reposo)
    line(ctx, [[suspX, suspY], [suspX, endY]], 'rgba(148,180,220,0.35)', 1.2, [4, 4]);
    line(ctx, [[endX, suspY], [endX, endY]], 'rgba(148,180,220,0.25)', 1.2, [4, 4]);

    // cotas en dos filas separadas, con marcas propias
    const baseY = toY(6.05);
    const reqX = originX - 6 + data.required * scale;
    const dhX = originX - 6 + data.dh * scale;
    const d0X = toX(data.d0);

    // fila 1: d0 (medida en reposo)
    line(ctx, [[originX, baseY], [d0X, baseY]], 'rgba(148,180,220,0.75)', 1.4);
    line(ctx, [[originX, baseY - 5], [originX, baseY + 5]], C.steel, 1.4);
    line(ctx, [[d0X, baseY - 5], [d0X, baseY + 5]], C.steel, 1.4);
    label(ctx, `d₀ = ${fmt(data.d0, 2)} m`, (originX + d0X) / 2, baseY - 8, {
      color: C.dim,
      size: 9.5,
      align: 'center',
      mono: true,
      bg: 'rgba(6,12,20,0.75)',
    });

    // fila 2: d_h con viento
    const dhY = baseY + 30;
    line(ctx, [[originX, dhY], [dhX, dhY]], data.ok ? C.teal : C.orange, 2.4);
    line(ctx, [[originX, dhY - 5], [originX, dhY + 5]], data.ok ? C.teal : C.orange, 1.6);
    line(ctx, [[dhX, dhY - 5], [dhX, dhY + 5]], data.ok ? C.teal : C.orange, 1.6);
    label(ctx, `d_h = ${fmt(data.dh, 2)} m`, dhX + 10, dhY + 4, {
      color: data.ok ? C.teal : C.orange,
      size: 10.5,
      mono: true,
    });

    // fila 3: separación exigida, fuera de las otras cotas
    const reqY = baseY + 56;
    line(ctx, [[originX, reqY], [reqX, reqY]], C.red, 1.6, [5, 4]);
    line(ctx, [[reqX, reqY - 16], [reqX, reqY + 6]], C.red, 1.4);
    label(ctx, `exigida ${fmt(data.required, 2)} m`, reqX + 9, reqY + 4, {
      color: C.red,
      size: 9.5,
      mono: true,
    });

    // Δx
    arrow(ctx, suspX, suspY + 6, endX, suspY + 6, C.violet, 1.4, true);
    label(ctx, `Δx = ${fmt(Math.abs(endX - suspX) / scale, 2)} m`, (suspX + endX) / 2, suspY - 4, {
      color: C.violet,
      size: 9.5,
      align: 'center',
      mono: true,
    });

    // aviso
    if (!data.ok) {
      roundRect(ctx, w * 0.60, h - 58, w * 0.36, 38, 9, 'rgba(255,92,108,0.14)', C.red);
      crossMark(ctx, w * 0.60 + 20, h - 39, 12, C.red, 2.2);
      label(ctx, 'distancia insuficiente', w * 0.60 + 36, h - 34, { color: C.red, size: 11, weight: 700 });
    } else {
      roundRect(ctx, w * 0.60, h - 58, w * 0.36, 38, 9, 'rgba(46,230,168,0.12)', C.teal);
      checkMark(ctx, w * 0.60 + 20, h - 40, 13, C.teal, 2.4);
      label(ctx, 'separación verificada', w * 0.60 + 36, h - 34, { color: C.teal, size: 11, weight: 700 });
    }
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
