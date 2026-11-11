import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, crossMark } from '../../lib/draw';
import { fmt, normalPdf } from '../../lib/num';

interface Data {
  u50: number;
  sigma: number;
  pTarget: number;
  uP: number;
}

/** Escena: cámara de ensayos con impulsos aleatorios y estadística en vivo. */
export function Scene04({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const ax = w * 0.235;
    const topY = 84;
    const botY = h - 84;

    // cámara de ensayo
    roundRect(ctx, ax - 104, topY - 40, 208, botY - topY + 76, 14, 'rgba(10,20,33,0.55)', 'rgba(148,180,220,0.2)');
    label(ctx, 'CÁMARA DE ENSAYO', ax, topY - 22, { color: C.dim, size: 8.5, align: 'center', weight: 700 });

    // electrodos tipo esfera-plano
    line(ctx, [[ax - 74, topY], [ax + 74, topY]], '#93a9c0', 4);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.strokeStyle = 'rgba(147,169,192,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax - 74, topY);
      ctx.lineTo(ax - 74 + i * 8 - 8, topY - 12);
      ctx.stroke();
      ctx.restore();
    }
    line(ctx, [[ax - 74, botY], [ax + 74, botY]], '#93a9c0', 4);
    roundRect(ctx, ax - 13, topY + 4, 26, 26, 12, 'rgba(180,200,220,0.55)');
    roundRect(ctx, ax - 13, botY - 30, 26, 26, 12, 'rgba(180,200,220,0.55)');
    label(ctx, 'electrodo', ax + 84, topY + 14, { color: C.dim, size: 8.5 });
    label(ctx, 'electrodo', ax + 84, botY - 4, { color: C.dim, size: 8.5 });

    // cota de la separación
    line(ctx, [[ax - 92, topY + 20], [ax - 92, botY - 20]], 'rgba(148,180,220,0.35)', 1, [4, 4]);
    label(ctx, 'aire', ax - 92, (topY + botY) / 2, { color: 'rgba(148,180,220,0.55)', size: 8.5, align: 'center' });

    // ensayos consecutivos
    const rate = 1.5;
    const n = Math.floor(t * rate);
    const phase = (t * rate) % 1;
    const rnd = (k: number) => {
      const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    // ¿el pico de este ensayo supera la tensión aplicada? (probabilidad objetivo)
    const fired = rnd(n + 1) < data.pTarget / 100;
    const active = phase < 0.5;
    const intensity = active ? Math.sin((phase / 0.5) * Math.PI) : 0;

    if (active) {
      const pts: [number, number][] = [];
      const seed = n + 1;
      for (let i = 0; i <= 16; i++) {
        const f = i / 16;
        pts.push([
          ax + Math.sin(i * 2.7 + seed * 1.7) * (10 + 6 * Math.sin(f * 9)) * (0.5 + intensity),
          topY + 34 + f * (botY - topY - 68),
        ]);
      }
      line(ctx, pts, fired ? '#eaf6ff' : 'rgba(140,190,230,0.45)', fired ? 2.4 : 1.3, undefined, fired ? 16 : 4);
      if (fired) {
        glowDot(ctx, ax, (topY + botY) / 2, 10 * intensity, C.cyan, 0.55 * intensity);
        label(ctx, 'DISRUPCIÓN', ax, (topY + botY) / 2 + 4, {
          color: '#eaf6ff',
          size: 11,
          align: 'center',
          weight: 800,
          bg: 'rgba(6,16,28,0.75)',
        });
      }
    }

    // tensión del impulso aplicado (onda)
    const waveY = botY + 34;
    const wavePts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const f = i / 60;
      const tt = f * 3.2;
      const v = Math.exp(-tt / 1.1) * (1 - Math.exp(-tt / 0.06));
      wavePts.push([ax - 74 + f * 148, waveY - v * 46 * (0.35 + 0.65 * intensity)]);
    }
    line(ctx, wavePts, fired ? C.amber : 'rgba(255,194,71,0.5)', 1.8, undefined, fired ? 8 : 0);
    label(ctx, `${fmt(data.uP, 0)} kV de cresta`, ax, waveY + 20, {
      color: 'rgba(255,194,71,0.8)',
      size: 8.5,
      align: 'center',
      mono: true,
    });

    // panel de estadística
    const cx = w * 0.47;
    const cw = w - cx - 22;
    roundRect(ctx, cx, 26, cw, 92, 12, 'rgba(10,22,36,0.9)', 'rgba(180,140,255,0.3)');
    const total = Math.max(1, n % 1000);
    const fails = Math.round(total * (data.pTarget / 100));
    label(ctx, 'ENSAYOS', cx + 18, 48, { color: C.dim, size: 8.5, weight: 700 });
    label(ctx, String(total).padStart(3, '0'), cx + 18, 82, { color: C.ink, size: 27, mono: true, weight: 700 });
    label(ctx, 'DISRUPCIONES', cx + cw * 0.36, 48, { color: C.dim, size: 8.5, weight: 700 });
    label(ctx, String(fails).padStart(3, '0'), cx + cw * 0.36, 82, {
      color: C.orange,
      size: 27,
      mono: true,
      weight: 700,
    });
    const observed = (fails / total) * 100;
    label(ctx, `observado ${fmt(observed, 0)} %`, cx + cw - 16, 48, {
      color: C.violet,
      size: 9,
      align: 'right',
      mono: true,
    });
    label(ctx, `objetivo ${fmt(data.pTarget, 0)} %`, cx + cw - 16, 64, {
      color: C.dim,
      size: 9,
      align: 'right',
      mono: true,
    });

    // distribución de tensión aplicada vs probabilidad
    const hx = cx + 12;
    const hy = 148;
    const hw = cw - 30;
    const hh = h - hy - 64;
    roundRect(ctx, cx, hy - 26, cw, hh + 40, 12, 'rgba(8,18,30,0.7)', 'rgba(148,180,220,0.15)');
    label(ctx, 'distribución normal del aislamiento (kV cresta)', hx, hy - 8, { color: C.dim, size: 9 });

    const lo = data.u50 - 3.4 * data.sigma;
    const hi = data.u50 + 3.4 * data.sigma;
    const sx = (u: number) => hx + ((u - lo) / (hi - lo)) * hw;
    const peak = normalPdf(0);
    const sy = (p: number) => hy + hh - (p / peak) * hh;

    // área de falla
    const areaPts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const u = lo + (i / 60) * (data.uP - lo);
      areaPts.push([sx(u), sy(normalPdf((u - data.u50) / data.sigma))]);
    }
    if (areaPts.length > 1) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,138,61,0.22)';
      ctx.beginPath();
      ctx.moveTo(areaPts[0][0], hy + hh);
      for (const [px, py] of areaPts) ctx.lineTo(px, py);
      ctx.lineTo(areaPts[areaPts.length - 1][0], hy + hh);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const curve: [number, number][] = [];
    for (let i = 0; i <= 80; i++) {
      const u = lo + (i / 80) * (hi - lo);
      curve.push([sx(u), sy(normalPdf((u - data.u50) / data.sigma))]);
    }
    line(ctx, curve, C.violet, 2);
    line(ctx, [[hx, hy + hh], [hx + hw, hy + hh]], 'rgba(148,180,220,0.35)', 1);

    // ejes de tensión
    for (const u of [data.u50 - 3 * data.sigma, data.u50, data.u50 + 3 * data.sigma]) {
      line(ctx, [[sx(u), hy + hh], [sx(u), hy + hh + 5]], 'rgba(148,180,220,0.4)', 1);
      label(ctx, fmt(u, 0), sx(u), hy + hh + 28, { color: C.faint, size: 8.5, align: 'center', mono: true });
    }

    // U50 y tensión aplicada
    line(ctx, [[sx(data.u50), hy], [sx(data.u50), hy + hh]], C.cyan, 1.4, [4, 4]);
    label(ctx, 'U₅₀', sx(data.u50) + 5, hy + 14, { color: C.cyan, size: 9, mono: true });
    line(ctx, [[sx(data.uP), hy], [sx(data.uP), hy + hh]], C.orange, 1.6, [4, 4]);
    label(ctx, `U${fmt(data.pTarget, 0)}`, sx(data.uP) + 5, hy + 30, { color: C.orange, size: 9, mono: true });

    // marca del ensayo actual
    if (active && fired) {
      crossMark(ctx, sx(data.uP), hy + hh - 22, 10, C.red, 2);
      label(ctx, 'falla', sx(data.uP) + 12, hy + hh - 18, { color: C.red, size: 8.5 });
    }
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
