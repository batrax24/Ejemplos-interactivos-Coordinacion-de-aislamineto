// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { EXPERIMENTS } from '../../experiments';
import { ExperimentView } from '../../components/ExperimentView';
import { LabHome } from '../../components/LabHome';
import { emptyProgress } from '../storage';

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

const mount = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
};

describe('estructura de la interfaz', () => {
  it('la portada tiene hero, 4 bloques y las 14 tarjetas con ecuación', () => {
    const host = mount(
      renderToString(
        createElement(LabHome, { progress: emptyProgress(), onGoto: () => {}, onStart: () => {}, onTour: () => {} }),
      ),
    );
    expect(host.querySelectorAll('.chapter').length).toBe(4);
    expect(host.querySelectorAll('.card').length).toBe(EXPERIMENTS.length);
    for (const card of host.querySelectorAll('.card')) {
      expect(card.querySelector('h4')?.textContent?.length).toBeGreaterThan(4);
      expect(card.querySelector('code')?.textContent?.length).toBeGreaterThan(3);
    }
    expect(host.querySelector('.hero__bar')).toBeTruthy();
    host.remove();
  });

  for (const def of EXPERIMENTS) {
    it(`${def.num} ${def.id}: escena, gráfica, sliders, lecturas y reto presentes`, () => {
      const host = mount(renderToString(createElement(ExperimentView, { def: def as never, ...props })));
      expect(host.querySelector('canvas.scene-canvas')).toBeTruthy();
      expect(host.querySelector('.plotwrap svg')).toBeTruthy();
      const sliders = host.querySelectorAll('.sliders input[type=range]').length;
      expect(sliders).toBeGreaterThanOrEqual(1);
      expect(host.querySelectorAll('.readout').length).toBeGreaterThanOrEqual(3);
      expect(host.querySelector('.challenge__goal')?.textContent?.length).toBeGreaterThan(3);
      expect(host.querySelectorAll('.livemath__line').length).toBeGreaterThanOrEqual(2);
      expect(host.querySelectorAll('.formulas code').length).toBeGreaterThanOrEqual(2);
      // cada slider tiene etiqueta y valor
      for (const sl of host.querySelectorAll('.slider:not(.slider--toggle)')) {
        expect(sl.querySelector('.slider__head label')?.textContent?.length).toBeGreaterThan(2);
        expect(sl.querySelector('.slider__value span')?.textContent?.length).toBeGreaterThan(0);
      }
      for (const tg of host.querySelectorAll('.slider--toggle .toggle')) {
        expect(tg.textContent?.length).toBeGreaterThan(4);
        expect(tg.getAttribute('aria-pressed')).toBeTruthy();
      }
      // sin glifos de texto vacíos en etiquetas clave
      expect(host.textContent).not.toContain('undefined');
      expect(host.textContent).not.toContain('NaN');
      host.remove();
    });
  }
});
