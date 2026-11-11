import { useEffect, useRef, useState } from 'react';

/** Ejecuta un callback en cada frame; se reinicia cuando cambian las deps. */
export function useRaf(cb: (t: number, dt: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ref.current((now - start) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Canvas con manejo de DPR y tamaño responsive. */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  active = true,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let t0 = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (active) {
      const loop = (now: number) => {
        const t = (now - t0) / 1000;
        const { w, h } = sizeRef.current;
        if (w > 0 && h > 0) drawRef.current(ctx, w, h, t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      const { w, h } = sizeRef.current;
      drawRef.current(ctx, w, h, 0);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      t0 = 0;
    };
  }, [active]);

  return canvasRef;
}

/** Media query reactiva. */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatch(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return match;
}
