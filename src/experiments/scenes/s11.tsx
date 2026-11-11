import { useCanvas } from '../../lib/hooks';
import { C, clear, grid, label, line, roundRect, glowDot, arrow, swatch } from '../../lib/draw';
import { fmt } from '../../lib/num';

interface Data {
  gamma: number;
  tau: number;
  incident: number;
  reflected: number;
  transmitted: number;
  Z1: number;
  Z2: number;
}

/** Escena: onda viajera con osciloscopio de tres trazas y contornos de impedancia. */
export function Scene11({ data }: { data: Data }) {
  const ref = useCanvas((ctx, w, h, t) => {
    clear(ctx, w, h);
    grid(ctx, w, h, 30, 0.045);

    const lineY = h * 0.36;
    const zx = w * 0.46;

    // línea 1 (Z1) dibujada más "gruesa" si Z1 es mayor
    const w1 = 1.5 + (data.Z1 / 600) * 3;
    const w2 = 1.5 + (Math.min(data.Z2, 600) / 600) * 3;

    // soportes de línea
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * ((zx - 60) / 4);
      line(ctx, [[x, lineY - 30], [x, lineY + 30]], 'rgba(148,180,220,0.18)', 1);
    }
    line(ctx, [[30, lineY - 34], [zx, lineY - 34]], 'rgba(160,190,215,0.5)', 1.2);
    line(ctx, [[30, lineY + 34], [zx, lineY + 34]], 'rgba(160,190,215,0.5)', 1.2);

    // conductores
    line(ctx, [[36, lineY], [zx, lineY]], C.cyan, w1, undefined, 8);
    line(ctx, [[zx, lineY], [w - 26, lineY]], data.gamma > 0 ? C.orange : C.violet, w2, undefined, 8);

    // onda incidente viajera
    const speed = 0.28;
    const ph = (t * speed) % 2;
    const paused = ph < 1;
    const pos = paused ? 36 + (zx - 36) * ph : zx;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const f = i / 24;
      const x = pos - 70 + f * 70;
      const v = Math.sin(Math.PI * f) * 26;
      pts.push([Math.max(36, x), lineY - v]);
    }
    line(ctx, pts, C.cyan, 2.2, undefined, 12);
    label(ctx, `${fmt(data.incident, 0)} kV`, Math.max(44, pos - 40), lineY - 34, { color: C.cyan, size: 9.5, mono: true });
    glowDot(ctx, pos, lineY, 3.4, C.cyan, 0.9);

    // onda reflejada
    if (!paused) {
      const rp = zx - (zx - 36) * (ph - 1);
      const rpts: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const f = i / 20;
        rpts.push([Math.max(36, rp - f * 60), lineY - Math.sin(Math.PI * f) * 22 * (data.gamma < 0 ? -1 : 1)]);
      }
      line(ctx, rpts, data.gamma < 0 ? C.violet : C.orange, 1.8, [6, 4], 8);
    }

    // unión
    line(ctx, [[zx, lineY - 56], [zx, lineY + 56]], 'rgba(255,194,71,0.55)', 1.4, [4, 4]);
    roundRect(ctx, zx - 54, lineY + 66, 108, 30, 8, 'rgba(9,20,33,0.9)', 'rgba(255,194,71,0.4)');
    label(ctx, 'unión', zx, lineY + 85, { color: C.amber, size: 10, align: 'center', weight: 700 });

    label(ctx, `Z₁ = ${fmt(data.Z1, 0)} Ω`, 44, lineY - 46, { color: C.cyan, size: 10, mono: true });
    label(ctx, `Z₂ = ${fmt(data.Z2, 0)} Ω`, w - 32, lineY - 46, { color: data.gamma > 0 ? C.orange : C.violet, size: 10, mono: true, align: 'right' });

    // osciloscopio
    const ox = 20;
    const oy = h * 0.56;
    const ow = w - 40;
    const oh = h - oy - 18;
    roundRect(ctx, ox, oy, ow, oh, 10, 'rgba(5,15,26,0.94)', 'rgba(56,225,255,0.25)');
    label(ctx, 'tensiones en la unión', ox + 12, oy + 17, { color: C.dim, size: 9 });

    const pw = ow - 26;
    const phh = oh - 40;
    const base = oy + 30;

    const mk = (fn: (x: number) => number, col: string, dash?: number[], wid = 1.7) => {
      const p: [number, number][] = [];
      for (let i = 0; i <= 80; i++) {
        const f = i / 80;
        p.push([ox + 13 + f * pw, base + phh / 2 - (fn(f) / (Math.max(1, Math.abs(data.incident) * 2.1))) * (phh / 2)]);
      }
      line(ctx, p, col, wid, dash);
    };

    // incidente (pulso de 1 tramo)
    mk((f) => (f < 0.5 ? data.incident * Math.sin(Math.PI * f * 2) : 0), C.cyan);
    mk((f) => (f < 0.5 ? data.reflected * Math.sin(Math.PI * f * 2) : 0), C.violet, [5, 4], 1.5);
    mk(
      (f) => (f >= 0.5 && f < 0.85 ? data.transmitted * Math.sin(Math.PI * ((f - 0.5) / 0.35)) : 0),
      C.orange,
      undefined,
      2,
    );
    line(ctx, [[ox + 13 + pw * 0.5, base], [ox + 13 + pw * 0.5, base + phh]], 'rgba(255,194,71,0.4)', 1, [4, 4]);
    swatch(ctx, ox + 14, oy + oh - 33, C.cyan);
    label(ctx, 'incidente', ox + 28, oy + oh - 30, { color: C.cyan, size: 9 });
    swatch(ctx, ox + 14, oy + oh - 21, C.violet);
    label(ctx, 'reflejada', ox + 28, oy + oh - 18, { color: C.violet, size: 9 });
    swatch(ctx, ox + 104, oy + oh - 21, C.orange);
    label(ctx, 'transmitida', ox + 118, oy + oh - 18, { color: C.orange, size: 9 });

    // valores
    label(ctx, `Γ = ${fmt(data.gamma, 2)} · τ = ${fmt(data.tau, 2)}`, w - 30, oy + 18, {
      color: C.amber,
      size: 12,
      align: 'right',
      mono: true,
      weight: 700,
    });

    arrow(ctx, 36, lineY + 44, zx - 8, lineY + 44, 'rgba(56,225,255,0.5)', 1.2);
    label(ctx, 'sentido de propagación', (36 + zx) / 2, lineY + 40, { color: 'rgba(56,225,255,0.5)', size: 8.5, align: 'center' });
  });

  return <canvas ref={ref} className="scene-canvas" />;
}
