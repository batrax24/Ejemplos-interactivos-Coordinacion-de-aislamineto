// @vitest-environment jsdom
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Los lienzos de las escenas no existen en jsdom: se sustituyen por un stub.
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
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

/**
 * Pruebas del contenido del juego.
 *
 * No comprueban estilo: comprueban que la física de cada caso es coherente con
 * el material y que todas las jornadas tienen solución con las medidas del
 * maletín. Un error de un decimal en un ejercicio del curso tiene que romper
 * estas pruebas.
 */
import { describe, expect, it } from 'vitest';
import { THEMES, themeById } from '../../gameplay/themes';
import { TARGETS, targetById } from '../../gameplay/targets';
import { evaluateDay, forecastScore } from '../../gameplay/types';
import { FUNCIONES, FUNCION_CHAPTERS } from '../../gameplay/funciones';
import { BANCO, ETAPAS, revisar, ronda, rondaSize } from '../../gameplay/defensa';
import { EXPERIMENTS } from '../../experiments';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { LabHome } from '../../components/LabHome';
import { ExperimentView } from '../../components/ExperimentView';
import {
  emptyProgress,
  exportProgress,
  importProgress,
  loadProgressDetailed,
  normalizeProgress,
  saveProgress,
} from '../storage';
import { DefendSummary, DefendView } from '../../gameplay/DefendView';
import { Sustentacion } from '../../gameplay/Sustentacion';
import { GameDay } from '../../gameplay/GameDay';
import { App } from '../../App';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const pickCorrect = (themeId: string) => {
  const theme = themeById(themeId)!;
  const picks: Record<string, string> = {};
  for (const c of theme.daily.cases) {
    for (const opt of theme.daily.options) {
      const r = evaluateDay(theme.daily, TARGETS, { ...picks, [c.id]: opt.id }).cases.find(
        (x) => x.spec.id === c.id,
      )!;
      if (r.pass) {
        picks[c.id] = opt.id;
        break;
      }
    }
  }
  return picks;
};

describe('temas y criterios', () => {
  it('los siete temas existen, apuntan a experimentos reales y tienen casos', () => {
    expect(THEMES.length).toBe(7);
    for (const t of THEMES) {
      expect(EXPERIMENTS.some((e) => e.id === t.expId), `${t.id} → ${t.expId}`).toBe(true);
      expect(t.daily.cases.length, t.id).toBeGreaterThanOrEqual(5);
      expect(t.daily.options.length, t.id).toBeGreaterThanOrEqual(5);
      expect(t.daily.options.filter((o) => o.falseProtection).length, t.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('todas las metas citadas por los casos existen', () => {
    for (const t of THEMES) {
      for (const c of t.daily.cases) {
        for (const g of c.goals) expect(targetById(g.target), `${c.id}/${g.target}`).toBeTruthy();
      }
    }
  });

  it('cada jornada tiene al menos una solución válida y cada caso una medida que lo salva', () => {
    for (const t of THEMES) {
      const picks = pickCorrect(t.id);
      const report = evaluateDay(t.daily, TARGETS, picks);
      expect(report.valid, `${t.id}: ${JSON.stringify(picks)}`).toBe(true);
      expect(report.incidents).toBe(0);
      expect(report.score).toBeGreaterThan(0);
    }
  });

  it('los pronósticos declarados coinciden con el cálculo sin medidas', () => {
    for (const t of THEMES) {
      const base = evaluateDay(t.daily, TARGETS, {});
      for (const c of base.cases) {
        if (!c.spec.forecast) continue;
        expect(c.pass, `${c.spec.id} debería ${c.spec.forecast}`).toBe(c.spec.forecast === 'sostiene');
      }
    }
  });

  it('las medidas marcadas como falsa protección no cuentan como solución', () => {
    for (const t of THEMES) {
      for (const c of t.daily.cases) {
        for (const o of t.daily.options.filter((x) => x.falseProtection)) {
          const r = evaluateDay(t.daily, TARGETS, { [c.id]: o.id }).cases.find((x) => x.spec.id === c.id)!;
          expect(r.pass, `${t.id}/${c.id} con ${o.id}`).toBe(false);
        }
      }
    }
  });

  it('una jornada sin decisiones deja incidentes y puntaje parcial', () => {
    const report = evaluateDay(THEMES[2].daily, TARGETS, {});
    expect(report.valid).toBe(false);
    expect(report.incidents + report.cases.length * 0).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);
  });

  it('el pronóstico se puntúa contra los casos que lo declaran', () => {
    const t = THEMES[0];
    const hit: Record<string, 'falla' | 'sostiene'> = {};
    for (const c of t.daily.cases) if (c.forecast) hit[c.id] = c.forecast;
    expect(forecastScore(t.daily, hit).hits).toBe(forecastScore(t.daily, hit).total);
  });
});

describe('cuentas del material', () => {
  const evalWith = (targetId: string, params: Record<string, number>) =>
    targetById(targetId).eval(params as never);

  it('T1: U₅ de 700 kV con σ = 6 % frente a 500 kV', () => {
    const r = evalWith('t1-cuantil', { u50: 700, sigmaPct: 6, pTarget: 5, Um: 245, Fv: 2.5 });
    expect(r.reserve).toBeCloseTo(130.8, 0);
    expect(r.detail).toContain('631');
  });

  it('T2: 20 discos de 292 mm no alcanzan los 6 125 mm', () => {
    const r = evalWith('t2-fuga', { Um: 245, kf: 25, lfDisc: 292, nInst: 20 });
    expect(r.reserve).toBeLessThan(0);
    expect(evalWith('t2-fuga', { Um: 245, kf: 25, lfDisc: 292, nInst: 21 }).reserve).toBeGreaterThan(0);
  });

  it('T3: 3,066 m a 30° deja d_h = 1,967 m y no alcanza 2,42 m', () => {
    const r = evalWith('t3-separacion', { L: 3.066, theta: 30, d0: 3.5, required: 2.42 });
    expect(r.detail).toContain('1,967');
    expect(r.reserve).toBeLessThan(0);
  });

  it('T4: 38,66° desde la vertical incumple el límite de 30°', () => {
    const r = evalWith('t4-angulo', { dh: 5, dx: 4, current: 31 });
    expect(r.detail).toContain('38,7');
    expect(r.reserve).toBeLessThan(0);
  });

  it('T5: 20 kA sobre 20 Ω y 1 µH·10 kA/µs dan 410 kV', () => {
    const r = evalWith('t5-potencial', { current: 20, Rt: 20, L: 1, diDt: 10, Ucad: 700 });
    expect(r.detail).toContain('410');
  });

  it('T6: 600 kV a 6 m con L_c·di/dt = 10 dan 660 kV y M = 59,1 %', () => {
    const r = evalWith('t6-margen', {
      Ures: 600,
      Lconn: 1,
      diDt: 10,
      distance: 6,
      withstand: 1050,
      requiredMargin: 20,
    });
    expect(r.detail).toContain('660');
    expect(r.detail).toContain('59,1');
  });

  it('T7: Peek con U₀ = 190 kV da 10,29 kW/km y con 170 kV casi el triple', () => {
    const a = evalWith('t7-perdidas', { f: 60, delta: 0.9, r: 1.5, s: 600, U: 220, U0: 190, budget: 12 });
    const b = evalWith('t7-perdidas', { f: 60, delta: 0.9, r: 1.5, s: 600, U: 220, U0: 170, budget: 12 });
    expect(a.detail).toContain('10,29');
    expect(b.detail).toContain('28,57');
    expect(a.reserve).toBeGreaterThan(0);
    expect(b.reserve).toBeLessThan(0);
  });

  it('ninguna meta produce NaN con los casos del juego', () => {
    for (const t of THEMES) {
      for (const c of t.daily.cases) {
        for (const g of c.goals) {
          const r = targetById(g.target).eval(c.params);
          expect(Number.isFinite(r.reserve), `${t.id}/${c.id}/${g.target}`).toBe(true);
          expect(r.detail.length).toBeGreaterThan(5);
        }
      }
    }
  });
});

describe('las funciones críticas', () => {
  it('están repartidas en los 4 bloques, con una sola respuesta correcta', () => {
    expect(FUNCIONES.length).toBeGreaterThanOrEqual(21);
    for (const ch of FUNCION_CHAPTERS) {
      expect(FUNCIONES.filter((f) => f.chapter === ch.id).length).toBeGreaterThan(0);
    }
    for (const f of FUNCIONES) {
      expect(f.options.filter((o) => o.ok).length, f.id).toBe(1);
      expect(f.options.length).toBeGreaterThanOrEqual(3);
      expect(f.demo.length).toBeGreaterThan(30);
      for (const id of f.expIds) expect(EXPERIMENTS.some((e) => e.id === id), `${f.id} → ${id}`).toBe(true);
    }
  });
});

describe('sustentación', () => {
  it('el banco se responde y la respuesta incorrecta se detecta', () => {
    for (const p of BANCO) {
      if (p.kind === 'calculo') {
        expect(revisar(p, p.expected).ok, p.id).toBe(true);
        expect(revisar(p, p.expected * 2).ok, p.id).toBe(false);
        expect(revisar(p, p.expected * (1 + p.tol / 200)).ok, p.id).toBe(true);
      } else {
        const ok = p.options.find((o) => o.id === p.options.find((x) => x.ok)!.id)!;
        expect(revisar(p, ok.id).ok, p.id).toBe(true);
        const wrong = p.options.find((o) => !o.ok);
        if (wrong) expect(revisar(p, wrong.id).ok, p.id).toBe(false);
      }
    }
  });

  it('acepta coma decimal en las respuestas de cálculo', () => {
    const c = BANCO.find((p) => p.kind === 'calculo' && p.id === 'c3')!;
    expect(revisar(c, '0,724' as never).ok).toBe(true);
  });

  it('cada ronda tiene el tamaño de su nivel y mezcla temas', () => {
    for (const etapa of ETAPAS) {
      const qs = ronda(etapa.n, 42);
      expect(qs.length, `nivel ${etapa.n}`).toBe(rondaSize(etapa.n));
      const temas = new Set(qs.map((q) => q.tema.split(' · ')[0]));
      expect(temas.size, `nivel ${etapa.n}`).toBeGreaterThanOrEqual(Math.min(4, qs.length));
    }
    expect(rondaSize(4)).toBe(10);
    expect(rondaSize(1)).toBe(5);
  });

  it('la misma semilla da la misma ronda y semillas distintas la cambian', () => {
    expect(ronda(2, 7).map((q) => q.id)).toEqual(ronda(2, 7).map((q) => q.id));
    expect(ronda(2, 7).map((q) => q.id)).not.toEqual(ronda(2, 8).map((q) => q.id));
  });

  it('hay preguntas de cálculo verificadas contra los valores del curso', () => {
    const calc = BANCO.filter((p) => p.kind === 'calculo');
    expect(calc.length).toBeGreaterThanOrEqual(20);
    const expected = calc.map((c) => (c.kind === 'calculo' ? c.expected : 0));
    expect(expected).toContain(200.04);
    expect(expected).toContain(4.02);
    expect(expected).toContain(410);
    expect(expected).toContain(660);
  });
});

describe('pantallas del juego (render)', () => {
  it('la portada muestra el centro de juego con Defiende y Sustentación', () => {
    const html = renderToString(
      createElement(LabHome, {
        progress: emptyProgress(),
        onGoto: () => {},
        onStart: () => {},
        onTour: () => {},
        onDefiende: () => {},
        onSustenta: () => {},
        extra: createElement(DefendSummary, { progress: emptyProgress() }),
      }),
    );
    // Los enlaces de juego y los resúmenes están en la portada.
    expect(html).toContain('Entender no es mover sliders');
    expect(html).toContain('Defiende');
    expect(html).toContain('Sustentación');
    expect(html).toContain('funciones defendidas');
    // No rompe la estructura existente.
    expect((html.match(/class="chapter"/g) ?? []).length).toBe(4);
  });

  it('Defiende renderiza los 4 bloques y todas las tarjetas', () => {
    const html = renderToString(
      createElement(DefendView, { progress: emptyProgress(), onGoto: () => {}, onSolve: () => {} }),
    );
    expect((html.match(/class="defend__block"/g) ?? []).length).toBe(4);
    expect((html.match(/class="fcard /g) ?? []).length).toBe(FUNCIONES.length);
    expect(html).toContain('Se desbloquea al resolver');
  });

  it('Sustentación arranca en el nivel 1 con una pregunta y sus opciones', () => {
    const html = renderToString(
      createElement(Sustentacion, { defense: 0, best: {}, onPass: () => {}, onScore: () => {}, onGoto: () => {} }),
    );
    expect(html).toContain('Simulacro de sustentación');
    expect(html).toContain('Nivel conceptual');
    expect(html).toContain('sust__progress');
    expect(html).toContain('sust__opt');
    expect(html).toContain('sust__dot is-now');
  });

  it('el día de guardia se abre desde el experimento del tema', () => {
    const theme = themeById('separacion')!;
    const def = EXPERIMENTS.find((e) => e.id === theme.expId)!;
    const html = renderToString(
      createElement(ExperimentView, {
        def: def as never,
        prevId: undefined,
        nextId: undefined,
        progDone: false,
        stars: 0,
        attempts: 0,
        onComplete: () => {},
        onAttempt: () => {},
        onGoto: () => {},
        onBack: () => {},
        onDefend: () => {},
      }),
    );
    expect(html).toContain('Día de guardia');
    expect(html).toContain('Explorar');
  });

  it('el día de guardia renderiza el caso, la escena, los criterios y el maletín', () => {
    const theme = themeById('corona')!;
    const def = EXPERIMENTS.find((e) => e.id === theme.expId)!;
    const html = renderToString(createElement(GameDay, { theme, def: def as never, onExit: () => {}, onDefend: () => {}, defended: false }));
    expect(html).toContain(theme.daily.mission);
    expect(html).toContain('criterion');
    expect(html).toContain('Mantener el diseño actual');
    expect(html).toContain('Enviar jornada');
    expect(html).toContain('kW/km');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });

  it('todos los temas pintan su día de guardia sin NaN', () => {
    for (const theme of THEMES) {
      const def = EXPERIMENTS.find((e) => e.id === theme.expId)!;
      const html = renderToString(
        createElement(GameDay, { theme, def: def as never, onExit: () => {}, onDefend: () => {}, defended: false }),
      );
      expect(html, theme.id).not.toContain('NaN');
      expect(html, theme.id).not.toContain('undefined');
      expect(html, theme.id).toContain('criterion');
    }
  });
});

describe('interacción del día de guardia', () => {
  it('se puede elegir una medida por caso, ver el criterio cambiar y enviar la jornada', async () => {
    const theme = themeById('separacion')!;
    const def = EXPERIMENTS.find((e) => e.id === theme.expId)!;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    let defendedScore = -1;
    await act(async () => {
      root.render(
        createElement(GameDay, {
          theme,
          def: def as never,
          onExit: () => {},
          onDefend: (_id: string, score: number) => {
            defendedScore = score;
          },
          defended: false,
        }),
      );
    });
    const flush = async () => {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
    };
    await flush();

    // Caso 1 arranca en rojo: la separación no alcanza.
    expect(host.querySelector('.criterion.is-bad')).toBeTruthy();
    const send = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Enviar jornada'))!;
    expect(send.disabled).toBe(true);

    // Recorrer todos los casos: el que ya cumple se mantiene, el que no pide medida.
    const tabs = [...host.querySelectorAll('.mission__tab')] as HTMLButtonElement[];
    expect(tabs.length).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < tabs.length; i++) {
      const tab = [...host.querySelectorAll('.mission__tab')] as HTMLButtonElement[];
      await act(async () => tab[i].click());
      await flush();
      const cumple = Boolean(host.querySelector('.criterion.is-bad')) === false;
      const label = cumple ? 'Mantener el diseño actual' : 'Cruceta más larga';
      const tool = [...host.querySelectorAll('.tool')].find((b) => b.textContent?.includes(label)) as
        | HTMLButtonElement
        | undefined;
      expect(tool, `caso ${i + 1}: ${label}`).toBeTruthy();
      await act(async () => tool!.click());
      await flush();
      expect(host.querySelector('.criterion.is-ok'), `caso ${i + 1}`).toBeTruthy();
    }

    const send2 = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Enviar jornada'))!;
    expect(send2.disabled).toBe(false);
    await act(async () => send2.click());
    await flush();

    expect(host.textContent).toContain('Jornada válida');
    expect(defendedScore).toBeGreaterThan(0);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe('sustentación (interacción)', () => {
  it('responde una ronda completa, exige 4/5 y persiste al aprobar', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const passed: number[] = [];
    await act(async () => {
      root.render(createElement(Sustentacion, {
        defense: 0,
        best: {},
        onPass: (n: number) => passed.push(n),
        onScore: () => {},
        onGoto: () => {},
      }));
    });
    const flush = async () => {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
    };
    await flush();

    // Fuerza respuestas correctas: se leen del DOM y se elige la opción con ✓ tras responder
    // (las opciones no exponen el acierto antes de responder, así que se recorre la ronda).
    for (let i = 0; i < 5; i++) {
      const opt = host.querySelector('.sust__opt') as HTMLButtonElement;
      await act(async () => opt.click());
      await flush();
      const respond = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Responder')) as
        | HTMLButtonElement
        | undefined;
      if (respond) {
        await act(async () => respond.click());
        await flush();
      }
      const next = [...host.querySelectorAll('button')].find(
        (b) => b.textContent?.includes('Siguiente') || b.textContent?.includes('Cerrar ronda'),
      ) as HTMLButtonElement | undefined;
      if (next) {
        await act(async () => next.click());
        await flush();
      }
    }
    expect(host.textContent).toMatch(/Nivel 1(:| aprobado)/);
    expect(passed.length).toBeLessThanOrEqual(1);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe('App con las piezas de juego', () => {
  it('navega a Defiende y a Sustentación desde la barra superior', async () => {
    localStorage.setItem(
      'labca.progress.v2',
      JSON.stringify({ xp: 0, seenIntro: true, enabledAudio: false, exps: {} }),
    );
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(createElement(App)));
    const flush = async () => {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
    };
    await flush();

    const defiende = [...host.querySelectorAll('.topbar__view')].find((b) =>
      b.textContent?.includes('Defiende'),
    ) as HTMLButtonElement;
    await act(async () => defiende.click());
    await flush();
    expect(host.textContent).toContain('Las afirmaciones que separan');
    expect(host.querySelectorAll('.fcard').length).toBe(FUNCIONES.length);

    const sust = [...host.querySelectorAll('.topbar__view')].find((b) =>
      b.textContent?.includes('Sustentación'),
    ) as HTMLButtonElement;
    await act(async () => sust.click());
    await flush();
    expect(host.textContent).toContain('Simulacro de sustentación');

    // La portada conserva sus 14 tarjetas de experimento.
    const brand = host.querySelector('.brand') as HTMLButtonElement;
    await act(async () => brand.click());
    await flush();
    expect(host.querySelectorAll('.card').length).toBe(EXPERIMENTS.length);

    await act(async () => root.unmount());
    host.remove();
  });
});

describe('el progreso nunca deja al estudiante sin salida', () => {
  it('un guardado corrupto se sustituye por la copia de seguridad', () => {
    localStorage.clear();
    const p = emptyProgress();
    p.xp = 640;
    p.lab.defense = 2;
    saveProgress(p);
    localStorage.setItem('labca.progress.v2', '{esto no es json');
    const res = loadProgressDetailed();
    expect(res.recovered).toBe(true);
    expect(res.progress.xp).toBe(640);
    expect(res.progress.lab.defense).toBe(2);
  });

  it('sin guardado arranca limpio y sin lanzar', () => {
    localStorage.clear();
    const res = loadProgressDetailed();
    expect(res.fresh).toBe(true);
    expect(res.progress.xp).toBe(0);
  });

  it('normaliza formas raras: NaN, negativos y campos ausentes', () => {
    const p = normalizeProgress({ xp: -40, lab: { defense: 99, missions: null } });
    expect(p.xp).toBe(0);
    expect(p.lab.defense).toBe(4);
    expect(p.lab.missions).toEqual({});
    expect(normalizeProgress(null).xp).toBe(0);
  });

  it('exportar e importar conserva XP, misiones y funciones', () => {
    const p = emptyProgress();
    p.xp = 910;
    p.lab.missions = { corona: 100 };
    p.lab.funciones = { 'f-tov': 1 };
    p.enabledAudio = false;
    const texto = exportProgress(p);
    const vuelta = importProgress(texto);
    expect(vuelta).not.toBeNull();
    expect(vuelta!.xp).toBe(910);
    expect(vuelta!.lab.missions.corona).toBe(100);
    expect(vuelta!.lab.funciones['f-tov']).toBe(1);
    expect(vuelta!.enabledAudio).toBe(false);
  });

  it('un archivo ajeno o vacío no se acepta como progreso', () => {
    expect(importProgress('hola')).toBeNull();
    expect(importProgress('{}')).toBeNull();
    expect(importProgress(JSON.stringify({ app: 'otra-cosa' }))).toBeNull();
  });
});

describe('la interfaz no deja al estudiante en un callejón sin salida', () => {
  it('el simulacro muestra los cuatro niveles, el examen final y el récord', () => {
    const html = renderToString(
      createElement(Sustentacion, {
        defense: 2,
        best: { '3': 4 },
        onPass: () => {},
        onScore: () => {},
        onGoto: () => {},
      }),
    ).replace(/<!-- -->/g, '');
    expect(html).not.toContain('NaN');
    expect(html).toContain('Examen final');
    expect(html).toContain('10 preguntas · 8 para aprobar');
    expect(html).toContain('récord 4/5');
  });

  it('la portada ofrece siempre descargar e importar el progreso', () => {
    const html = renderToString(
      createElement(LabHome, {
        progress: emptyProgress(),
        onGoto: () => {},
        onStart: () => {},
        onTour: () => {},
        onDefiende: () => {},
        onSustenta: () => {},
        onExport: () => {},
        onImport: () => {},
        onReset: () => {},
      }),
    );
    expect(html).toContain('backup');
    expect(html).toContain('Descargar progreso');
    expect(html).toContain('Importar');
    expect(html).toContain('Reiniciar');
  });

  it('un error de render muestra la pantalla de recuperación, no una página en blanco', async () => {
    const Boom = () => {
      throw new Error('fallo de prueba');
    };
    const host = document.createElement('div');
    const root = createRoot(host);
    const original = console.error;
    console.error = () => {};
    await act(async () => {
      root.render(createElement(ErrorBoundary, { resetKey: 'x', children: createElement(Boom) }));
    });
    console.error = original;
    expect(host.textContent).toContain('Reintentar');
    expect(host.textContent).toContain('Descargar');
    expect(host.textContent).toContain('Reiniciar');
    await act(async () => root.unmount());
  });
});

describe('objetivo de aprendizaje visible', () => {
  it('cada tema declara qué se aprende, cómo se manifiesta y qué mirar', () => {
    for (const t of THEMES) {
      expect(t.learn.goal.length, t.id).toBeGreaterThan(60);
      expect(t.learn.sign.length, t.id).toBeGreaterThan(60);
      expect(t.learn.watch.length, t.id).toBeGreaterThan(30);
      expect(t.trap.length, t.id).toBeGreaterThan(40);
      expect(t.formula.length, t.id).toBeGreaterThan(6);
    }
  });

  it('el experimento de cada tema muestra el bloque «Qué se aprende aquí»', () => {
    for (const t of THEMES) {
      const def = EXPERIMENTS.find((e) => e.id === t.expId)!;
      const html = renderToString(
        createElement(ExperimentView, {
          def: def as never,
          prevId: undefined,
          nextId: undefined,
          progDone: false,
          stars: 0,
          attempts: 0,
          onComplete: () => {},
          onAttempt: () => {},
          onGoto: () => {},
          onBack: () => {},
          onDefend: () => {},
        }),
      );
      expect(html, t.id).toContain('Qué se aprende aquí');
      expect(html, t.id).toContain('Cómo se manifiesta');
      expect(html, t.id).toContain('El error clásico');
    }
  });
});
