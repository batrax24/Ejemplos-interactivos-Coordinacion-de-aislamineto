// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from '../../App';
import { EXPERIMENTS } from '../../experiments';

// canvas no existe en jsdom
const ctxStub = new Proxy(
  {},
  {
    get: (_t, prop) => {
      if (prop === 'measureText') return () => ({ width: 10 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
        return () => ({ addColorStop: () => {} });
      return () => {};
    },
    set: () => true,
  },
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = () => ctxStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getBoundingClientRect = () => ({
  width: 900,
  height: 520,
  top: 0,
  left: 0,
  right: 900,
  bottom: 520,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});
class RO {
  observe() {}
  disconnect() {}
}
const g = globalThis as unknown as Record<string, unknown>;
g.ResizeObserver = RO;
g.requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(performance.now()), 16) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

let host: HTMLDivElement;
let root: Root;

const flush = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
};

beforeEach(() => {
  localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe('App interactiva', () => {
  it('muestra portada y navega a un experimento', async () => {
    await act(async () => root.render(<App />));
    await flush();
    expect(host.textContent).toContain('Coordinación de');
    expect(host.querySelectorAll('.card').length).toBe(EXPERIMENTS.length);

    const first = host.querySelector('.card') as HTMLButtonElement;
    await act(async () => first.click());
    await flush();
    expect(host.textContent).toContain('De entre fases a fase–tierra');
    expect(host.textContent).toContain('Ecuación viva');
  });

  it('mueve un deslizador y actualiza la ecuación viva', async () => {
    localStorage.setItem(
      'labca.progress.v2',
      JSON.stringify({ xp: 0, seenIntro: true, enabledAudio: false, exps: {} }),
    );
    await act(async () => root.render(<App />));
    await flush();
    await act(async () => (host.querySelector('.card') as HTMLButtonElement).click());
    await flush();
    const before = host.querySelector('.livemath__line.is-last')?.textContent ?? '';
    const range = host.querySelector('input[type=range]') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(range, '500');
      range.dispatchEvent(new Event('change', { bubbles: true }));
      range.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await flush();
    const after = host.querySelector('.livemath__line.is-last')?.textContent ?? '';
    expect(before).not.toBe(after);
    // 500 kV entre fases → 288,68 kV eficaces y 408,25 kV de cresta
    expect(after).toContain('288,68');
    expect(after).toContain('408,25');
  });

  it('valida un reto y otorga estrellas y XP', async () => {
    localStorage.setItem(
      'labca.progress.v2',
      JSON.stringify({ xp: 0, seenIntro: true, enabledAudio: false, exps: {} }),
    );
    await act(async () => root.render(<App />));
    await flush();
    await act(async () => (host.querySelector('.card') as HTMLButtonElement).click());
    await flush();
    const validate = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Validar'))!;
    await act(async () => validate.click());
    await flush();
    expect(host.textContent).toContain('¡Reto resuelto!');
    const saved = JSON.parse(localStorage.getItem('labca.progress.v2')!);
    expect(saved.exps.tensiones.done).toBe(true);
    expect(saved.exps.tensiones.stars).toBeGreaterThan(0);
    expect(saved.xp).toBeGreaterThan(0);
    expect(host.textContent).toContain('1/14');
  });

  it('recorre las 14 estaciones sin errores de render', async () => {
    localStorage.setItem(
      'labca.progress.v2',
      JSON.stringify({ xp: 0, seenIntro: true, enabledAudio: false, exps: {} }),
    );
    await act(async () => root.render(<App />));
    await flush();
    for (const def of EXPERIMENTS) {
      await act(async () => {
        const cards = [...host.querySelectorAll('.card')];
        const card = cards[EXPERIMENTS.indexOf(def)] as HTMLButtonElement;
        card.click();
      });
      await flush();
      expect(host.textContent, def.id).toContain(def.title);
      expect(host.querySelectorAll('.readout').length, def.id).toBeGreaterThan(2);
      // volver
      const back = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Laboratorio'))!;
      await act(async () => back.click());
      await flush();
    }
  });

  it('la misión final arranca en verde con el proyecto de referencia', async () => {
    localStorage.setItem(
      'labca.progress.v2',
      JSON.stringify({ xp: 0, seenIntro: true, enabledAudio: false, exps: {} }),
    );
    await act(async () => root.render(<App />));
    await flush();
    const cards = [...host.querySelectorAll('.card')] as HTMLButtonElement[];
    await act(async () => cards[cards.length - 1].click());
    await flush();
    const validate = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Validar'))!;
    await act(async () => validate.click());
    await flush();
    expect(host.textContent).toContain('Proyecto coordinado');
  });
});
