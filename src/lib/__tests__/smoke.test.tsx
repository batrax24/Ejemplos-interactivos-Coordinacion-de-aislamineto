import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { EXPERIMENTS } from '../../experiments';
import { defaults } from '../../experiments/types';
import { ExperimentView } from '../../components/ExperimentView';
import { SvgPlot } from '../../components/ui';

const props = {
  prevId: undefined,
  nextId: undefined,
  progDone: false,
  stars: 0,
  attempts: 0,
  onComplete: () => {},
  onAttempt: () => {},
  onGoto: () => {},
  onBack: () => {},
};

describe('render de los 14 experimentos', () => {
  for (const def of EXPERIMENTS) {
    it(`renderiza ${def.id}`, () => {
      const html = renderToString(
        createElement(ExperimentView, { def: def as never, key: def.id, ...props }),
      );
      expect(html.length).toBeGreaterThan(1200);
      expect(html).toContain(def.title.slice(0, 12));
      expect(html).toContain('Ecuación viva');
    });

    it(`calcula lecturas finitas en ${def.id}`, () => {
      const data = def.compute(defaults(def.params));
      const readouts = def.readouts(data as never);
      expect(readouts.length).toBeGreaterThan(2);
      for (const r of readouts) {
        expect(r.value, `${def.id}/${r.label}`).not.toBe('NaN');
        expect(String(r.value)).not.toContain('NaN');
        expect(String(r.value)).not.toContain('Infinity');
      }
      const live = def.live(defaults(def.params));
      expect(live.length).toBeGreaterThan(0);
      for (const line of live) expect(line).not.toContain('NaN');
    });
  }
});

describe('SvgPlot', () => {
  it('dibuja series y marcadores', () => {
    const pts: [number, number][] = Array.from({ length: 30 }, (_, i) => [i, Math.sin(i / 3)]);
    const html = renderToString(
      createElement(SvgPlot, {
        series: [{ points: pts, color: '#38e1ff', label: 'x' }],
        xDomain: [0, 29],
        yDomain: [-1, 1],
        markers: [{ y: 0.5, color: '#f00', label: 'lim' }],
        bands: [{ y: [0.2, 0.6], color: '#0f0' }],
      }),
    );
    expect(html).toContain('svg');
    expect(html).toContain('path');
  });
});
