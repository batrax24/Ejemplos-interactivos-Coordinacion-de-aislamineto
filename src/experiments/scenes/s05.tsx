import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, arrow, firefly } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  alt: number;
  tempC: number;
  pressure: number;
  delta: number;
  u50: number;
}

/** Escena: perfil de montaña con torres a distinta altitud y densidad del aire. */
export function Scene05({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    // cielo con gradiente por altitud
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, `rgba(${20 + 20 * (1 - data.delta)}, ${34 + 30 * (1 - data.delta)}, ${70 + 40 * (1 - data.delta)}, 1)`);
    sky.addColorStop(1, '#050a12');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    grid(ctx, w, h, 30, 0.04);

    const baseY = h - 40;
    const groundY = baseY;

    // perfil de montaña
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= w; x += 8) {
      const f = x / w;
      const ridge =
        Math.sin(f * Math.PI * 2.2) * 22 + Math.sin(f * Math.PI * 5.1 + 1) * 10 + f * 74;
      ctx.lineTo(x, groundY - ridge);
    }
    ctx.lineTo(w, groundY);
    ctx.closePath();
    const mg = ctx.createLinearGradient(0, groundY - 90, 0, groundY);
    mg.addColorStop(0, 'rgba(46,230,168,0.26)');
    mg.addColorStop(1, 'rgba(20,36,54,0.9)');
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(46,230,168,0.65)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // partículas de aire: densidad proporcional
    const n = Math.round(26 * Math.pow(data.delta, 1.6));
    for (let i = 0; i < n; i++) {
      const px = ((i * 137.5 + t * 12 * (0.4 + (i % 5) / 8)) % w);
      const py = 40 + ((i * 71.3 + Math.sin(t * 0.6 + i) * 12) % (h - 110));
      glowDot(ctx, px, py, 1.5, C.cyan, 0.20 + 0.1 * Math.sin(t * 2 + i));
    }

    // torre en la cima con aislador
    const tx = w * 0.56;
    const ridgeAt = (x: number) => {
      const f = x / w;
      return groundY - (Math.sin(f * Math.PI * 2.2) * 22 + Math.sin(f * Math.PI * 5.1 + 1) * 10 + f * 74);
    };
    const ty = ridgeAt(tx);
    const TH = Math.min(168, h * 0.42);
    line(ctx, [[tx - 27, ty], [tx - 7, ty - TH], [tx + 7, ty - TH], [tx + 27, ty]], '#93a9c0', 2.4);
    for (let i = 0; i < 7; i++) {
      const f0 = i / 7;
      const y0 = ty - f0 * TH;
      const y1 = ty - (i + 1) / 7 * TH;
      const w0 = 27 - 20 * f0;
      const w1 = 27 - 20 * (i + 1) / 7;
      line(ctx, [[tx - w1, y1], [tx + w0, y0]], 'rgba(160,190,215,0.4)', 1);
      line(ctx, [[tx + w1, y1], [tx - w0, y0]], 'rgba(160,190,215,0.4)', 1);
    }
    line(ctx, [[tx - 58, ty - TH], [tx + 58, ty - TH]], '#93a9c0', 3);
    line(ctx, [[tx - 58, ty - TH], [tx - 58, ty - TH + 26]], 'rgba(180,200,220,0.4)', 1);
    line(ctx, [[tx + 58, ty - TH], [tx + 58, ty - TH + 26]], 'rgba(180,200,220,0.4)', 1);
    for (let k = 0; k < 2; k++) {
      const sxp = k === 0 ? tx - 58 : tx + 58;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.fillStyle = 'rgba(200,216,232,0.9)';
        ctx.beginPath();
        ctx.ellipse(sxp, ty - TH + 30 + i * 6, 9, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      glowDot(ctx, sxp, ty - TH + 30 + 30, 3.2, C.cyan, 0.6);
    }
    label(ctx, `torre a ${fmt(data.alt, 0)} m`, tx, ty + 16, { color: C.dim, size: 9.5, align: 'center' });

    // columna de presión / densidad
    const bx = w - 74;
    const bTop = 96;
    const bH = h - 176;
    roundRect(ctx, bx - 18, bTop, 42, bH + 16, 8, 'rgba(8,18,30,0.75)', 'rgba(148,180,220,0.18)');
    const fill = Math.max(0.03, data.delta);
    ctx.save();
    const bg = ctx.createLinearGradient(0, bTop + bH, 0, bTop);
    bg.addColorStop(0, 'rgba(56,225,255,0.15)');
    bg.addColorStop(1, 'rgba(56,225,255,0.75)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(bx - 10, bTop + bH - bH * fill, 26, bH * fill, 4);
    ctx.fill();
    ctx.restore();
    for (let i = 0; i <= 5; i++) {
      const yy = bTop + bH - (i / 5) * bH;
      line(ctx, [[bx - 20, yy], [bx + 6, yy]], 'rgba(148,180,220,0.25)', 1);
      label(ctx, (i * 0.2).toFixed(1), bx + 10, yy + 4, { color: C.dim, size: 8.5, mono: true });
    }
    label(ctx, 'δ', bx - 2, bTop - 8, { color: C.cyan, size: 12, align: 'center', weight: 700 });
    glowDot(ctx, bx + 3, bTop + bH - bH * fill, 3.4, C.cyan, 0.9);

    // datos
    label(ctx, `p = ${fmt(data.pressure, 2)} kPa`, 16, 26, { color: C.ink, size: 12, mono: true });
    label(ctx, `δ = ${fmt(data.delta, 3)}`, 16, 46, { color: C.cyan, size: 16, mono: true, weight: 700 });
    label(ctx, `U₅₀ corregida = ${fmt(data.u50, 1)} kV`, 16, 64, { color: C.teal, size: 11, mono: true });

    // flecha descendente temperatura
    arrow(ctx, w * 0.16, 92, w * 0.16, 132, C.orange, 1.6);
    label(ctx, `${fmt(data.tempC, 0)} °C`, w * 0.16 + 8, 116, { color: C.orange, size: 10, mono: true });

    firefly(ctx, t, w * 0.5, h * 0.25, 50, 8, C.cyan);
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
