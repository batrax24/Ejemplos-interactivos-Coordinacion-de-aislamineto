import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  Uc: number;
  Ures: number;
  distance: number;
  extra: number;
  UinEquipment: number;
  Uwithstand: number;
  margin: number;
  ok: boolean;
}

/** Escena / unifilar de subestación: pararrayos, equipo y onda limitada. */
export function Scene12({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const busY = 66;
    const groundY = h - 40;

    // barraje
    line(ctx, [[36, busY], [w - 30, busY]], '#93a9c0', 4.5);
    label(ctx, 'barraje', w - 34, busY - 10, { color: C.dim, size: 9, align: 'right' });
    for (let x = 40; x < w - 40; x += 46) {
      glowDot(ctx, x, busY, 1.8, 'rgba(56,225,255,0.5)', 0.5 + 0.3 * Math.sin(t * 2 + x * 0.05));
    }

    // pararrayos
    const px = w * 0.22;
    line(ctx, [[px, busY], [px, busY + 26]], C.cyan, 2);
    const segs = 6;
    const stackH = 92;
    for (let i = 0; i < segs; i++) {
      const yy = busY + 28 + i * (stackH / segs);
      roundRect(ctx, px - 11, yy + 2, 22, stackH / segs - 5, 3, i % 2 ? 'rgba(180,200,220,0.85)' : 'rgba(140,165,190,0.9)');
    }
    line(ctx, [[px, busY + 28 + stackH], [px, groundY]], C.steel, 1.6);
    line(ctx, [[px - 26, groundY], [px + 26, groundY]], C.teal, 2.4);
    for (let i = 0; i < 3; i++) line(ctx, [[px - 18 + i * 18, groundY], [px - 18 + i * 18, groundY + 12]], C.teal, 1.6);
    glowDot(ctx, px, busY + 28 + stackH * 0.5, 5, C.violet, 0.35 + 0.25 * Math.sin(t * 3));
    label(ctx, 'pararrayos', px, groundY + 22, { color: C.violet, size: 9.5, align: 'center' });
    label(ctx, `U_c ${fmt(data.Uc, 0)} kV · U_res ${fmt(data.Ures, 0)} kV`, px + 14, busY + 26, {
      color: C.dim,
      size: 8.5,
      align: 'left',
      mono: true,
    });


    // equipo (transformador de potencia) a la derecha
    const ex = px + Math.min(w * 0.40, Math.max(120, data.distance * 9));
    const tankW = 96;
    const tankH = 84;
    const tankY = groundY - tankH - 12;
    // bujes del equipo
    line(ctx, [[ex, busY], [ex, tankY - 26]], C.steel, 2);
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.fillStyle = 'rgba(190,208,226,0.9)';
      ctx.beginPath();
      ctx.ellipse(ex, busY + 12 + i * 9, 7, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // tanque
    roundRect(ctx, ex - tankW / 2, tankY, tankW, tankH, 8, 'rgba(24,40,58,0.95)', '#9fb6cd', 2);
    line(ctx, [[ex - tankW / 2 + 8, tankY + 26], [ex + tankW / 2 - 8, tankY + 26]], 'rgba(159,182,205,0.35)', 1.4);
    label(ctx, 'equipo', ex, tankY + 50, { color: 'rgba(200,220,240,0.82)', size: 9.5, align: 'center', weight: 600 });
    label(ctx, `BIL ${fmt(data.Uwithstand, 0)} kV`, ex, tankY + 68, {
      color: 'rgba(56,225,255,0.9)',
      size: 8.5,
      align: 'center',
      mono: true,
    });
    // puesta a tierra del tanque
    line(ctx, [[ex, tankY + tankH], [ex, groundY]], C.teal, 2);
    line(ctx, [[ex - 16, groundY], [ex + 16, groundY]], C.teal, 2.2);

    // distancia con cota
    const dy = busY - 22;
    line(ctx, [[px, dy], [ex, dy]], C.amber, 1.4, [5, 3]);
    label(ctx, `d = ${fmt(data.distance, 1)} m`, (px + ex) / 2, dy - 6, { color: C.amber, size: 9.5, align: 'center', mono: true });

    // efecto inductivo en el espacio libre entre pararrayos y equipo
    label(ctx, `ΔU = L·di/dt·d = ${fmt(data.extra, 1)} kV`, px + 20, busY + 148, {
      color: data.extra > 60 ? C.orange : C.dim,
      size: 9,
      align: 'left',
      mono: true,
    });

    // gráfico de niveles (U equipo)
    const gx = w * 0.68;
    const gy = groundY - 206;
    const gw = w - gx - 24;
    const mx = data.Uwithstand * 1.15;
    const barH = 18;
    const rows = [
      { label: 'U_res', value: data.Ures, color: C.violet },
      { label: 'U_eq', value: data.UinEquipment, color: data.ok ? C.teal : C.orange },
      { label: 'BIL', value: data.Uwithstand, color: C.cyan },
    ];
    rows.forEach((r, i) => {
      const yy = gy + i * 34;
      label(ctx, r.label, gx - 6, yy + 13, { color: C.dim, size: 9, align: 'right', mono: true });
      roundRect(ctx, gx, yy, gw, barH, 4, 'rgba(255,255,255,0.06)');
      roundRect(ctx, gx, yy, Math.min(1, r.value / mx) * gw, barH, 4, r.color);
      label(ctx, `${fmt(r.value, 0)} kV`, gx + Math.min(1, r.value / mx) * gw + 6, yy + 13, {
        color: r.color,
        size: 9,
        mono: true,
      });
    });

    // margen
    const my = gy + 118;
    roundRect(ctx, gx - 40, my, w - gx + 16, 52, 10, data.ok ? 'rgba(46,230,168,0.10)' : 'rgba(255,138,61,0.12)', data.ok ? C.teal : C.orange);
    label(ctx, 'margen M', gx - 26, my + 20, { color: C.dim, size: 8.5 });
    label(ctx, `${fmt(data.margin, 1)} %`, gx - 26, my + 42, {
      color: data.ok ? C.teal : C.orange,
      size: 18,
      mono: true,
      weight: 700,
    });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
