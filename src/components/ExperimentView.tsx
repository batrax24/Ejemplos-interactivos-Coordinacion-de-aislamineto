import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentDef, Params } from '../experiments/types';
import { defaults } from '../experiments/types';
import { fmt } from '../lib/num';
import { sfx } from '../lib/audio';
import { Collapse, Icon, LiveMath, Panel, ReadoutGrid, Slider, Stars, Toggle } from './ui';
import { GameDay } from '../gameplay/GameDay';
import { THEMES } from '../gameplay/themes';

interface Props {
  def: ExperimentDef<never>;
  prevId?: string;
  nextId?: string;
  progDone: boolean;
  stars: number;
  attempts: number;
  onComplete: (id: string, stars: number) => void;
  onAttempt: (id: string) => void;
  onGoto: (id: string) => void;
  onBack: () => void;
  /** Misión de guardia del experimento, si el tema la tiene. */
  defended?: boolean;
  onDefend?: (themeId: string, score: number) => void;
  /** Borrador del día de guardia del tema (medidas ya elegidas). */
  draft?: Record<string, string>;
  onDraft?: (themeId: string, picks: Record<string, string>) => void;
}

export function ExperimentView({
  def,
  prevId,
  nextId,
  progDone,
  stars,
  attempts,
  onComplete,
  onAttempt,
  onGoto,
  onBack,
  defended = false,
  onDefend,
  draft,
  onDraft,
}: Props) {
  const [params, setParams] = useState<Params>(() => defaults(def.params));
  const [hintOpen, setHintOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ pass: boolean; detail: string } | null>(null);
  const [justSolved, setJustSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [mode, setMode] = useState<'explorar' | 'mision'>('explorar');
  const resultRef = useRef<HTMLDivElement>(null);
  const theme = THEMES.find((t) => t.expId === def.id);

  // Reinicia al cambiar de experimento
  useEffect(() => {
    setParams(defaults(def.params));
    setFeedback(null);
    setHintOpen(false);
    setJustSolved(false);
    setMode('explorar');
  }, [def]);

  const data = useMemo(() => def.compute(params) as never, [def, params]);
  const readouts = useMemo(() => def.readouts(data), [def, data]);
  const verdict = def.verdict?.(data);
  const live = useMemo(() => def.live(params), [def, params]);
  const check = useMemo(() => def.challenge.test(params), [def, params]);
  const goalMet = progDone || check.pass;

  const setParam = useCallback(
    (id: string, v: number) => {
      setParams((prev) => ({ ...prev, [id]: v }));
      if (justSolved) setJustSolved(false);
    },
    [justSolved],
  );

  const applyPreset = (preset: Partial<Params>) => {
    setParams((prev) => {
      const next: Params = { ...prev };
      for (const [k, v] of Object.entries(preset)) if (v !== undefined) next[k] = v;
      return next;
    });
    sfx.click();
    setFeedback(null);
  };

  const reset = () => {
    setParams(defaults(def.params));
    setFeedback(null);
    setHintOpen(false);
    sfx.click();
  };

  const validate = () => {
    onAttempt(def.id);
    const res = def.challenge.test(params);
    setFeedback(res);
    if (res.pass) {
      const s = attempts === 0 && !hintOpen ? 3 : attempts <= 2 && !hintOpen ? 2 : 1;
      const best = progDone ? Math.max(stars, s) : s;
      onComplete(def.id, best);
      setEarned(best);
      setJustSolved(true);
      sfx.success();
    } else {
      sfx.fail();
    }
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  };

  const visibleParams = def.params.filter((p) => !p.showIf || p.showIf(params));

  if (mode === 'mision' && theme && onDefend) {
    return (
      <div className="exp">
        <header className="exp__head">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="arrowLeft" size={16} /> Laboratorio
          </button>
          <div className="exp__title">
            <span className="exp__num">{def.num}</span>
            <div>
              <h2>{def.title}</h2>
              <p>
                {def.kicker} · <span className="mono">{def.slides}</span>
              </p>
            </div>
          </div>
          <div className="exp__nav">
            <div className="modetabs" role="tablist" aria-label="Modo del experimento">
              <button
                type="button"
                role="tab"
                aria-selected={false}
                className="modetab"
                onClick={() => {
                  setMode('explorar');
                  sfx.click();
                }}
              >
                <Icon name="gauge" size={14} /> Explorar
              </button>
              <button type="button" role="tab" aria-selected className="modetab is-on">
                <Icon name="shield" size={14} /> Día de guardia
                {defended && <Icon name="check" size={12} />}
              </button>
            </div>
          </div>
        </header>
        <div className="mission__frame">
          <aside className="mission__side">
            <p className="mission__sidetag">
              <Icon name="info" size={13} /> Del tema a la decisión
            </p>
            <h4>{theme.title}</h4>
            <p className="mission__q">{theme.question}</p>
            <p>{theme.concept}</p>
            <code className="mission__formula">{theme.formula}</code>
            <div className="mission__trap">
              <Icon name="flame" size={14} />
              <p>{theme.trap}</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--tiny"
              onClick={() => {
                setMode('explorar');
                sfx.click();
              }}
            >
              <Icon name="gauge" size={13} /> Abrir los sliders
            </button>
          </aside>
          <GameDay
            theme={theme}
            def={def}
            defended={defended}
            draft={draft}
            onDraft={onDraft}
            onExit={() => setMode('explorar')}
            onDefend={onDefend}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="exp">
      <header className="exp__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          <Icon name="arrowLeft" size={16} /> Laboratorio
        </button>
        <div className="exp__title">
          <span className="exp__num">{def.num}</span>
          <div>
            <h2>{def.title}</h2>
            <p>
              {def.kicker} · <span className="mono">{def.slides}</span>
            </p>
          </div>
        </div>
        <div className="exp__nav">
          {theme && onDefend && (
            <div className="modetabs" role="tablist" aria-label="Modo del experimento">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'explorar'}
                className={`modetab ${mode === 'explorar' ? 'is-on' : ''}`}
                onClick={() => {
                  setMode('explorar');
                  sfx.click();
                }}
              >
                <Icon name="gauge" size={14} /> Explorar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'mision'}
                className={`modetab ${mode === 'mision' ? 'is-on' : ''}`}
                onClick={() => {
                  setMode('mision');
                  sfx.click();
                }}
              >
                <Icon name="shield" size={14} /> Día de guardia
                {defended && <Icon name="check" size={12} />}
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn btn--icon"
            disabled={!prevId}
            onClick={() => prevId && onGoto(prevId)}
            aria-label="Experimento anterior"
          >
            <Icon name="arrowLeft" />
          </button>
          <button
            type="button"
            className="btn btn--icon"
            disabled={!nextId}
            onClick={() => nextId && onGoto(nextId)}
            aria-label="Experimento siguiente"
          >
            <Icon name="arrowRight" />
          </button>
        </div>
      </header>

      <div className="exp__grid">
        <section className="exp__stage">
          <div className="stage">
            <def.Scene data={data} />
            <div className="stage__badge">
              <Icon name="eye" size={13} /> escena en vivo
            </div>
          </div>

          <div className="idea">
            <Icon name="spark" size={16} />
            <p>{def.idea}</p>
          </div>

          {theme && (
            <Panel title="Qué se aprende aquí" icon="target">
              <div className="learn">
                <div className="learn__row">
                  <span className="learn__tag">Al terminar</span>
                  <p>{theme.learn.goal}</p>
                </div>
                <div className="learn__row">
                  <span className="learn__tag">Cómo se manifiesta</span>
                  <p>{theme.learn.sign}</p>
                </div>
                <div className="learn__row">
                  <span className="learn__tag">Qué mirar</span>
                  <p>{theme.learn.watch}</p>
                </div>
                <div className="learn__trap">
                  <Icon name="flame" size={14} />
                  <p>
                    <strong>El error clásico:</strong> {theme.trap}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--tiny learn__cta"
                  onClick={() => {
                    setMode('mision');
                    sfx.nav();
                  }}
                >
                  <Icon name="shield" size={13} /> Ponerlo a prueba en el día de guardia
                </button>
              </div>
            </Panel>
          )}

          <Panel title="Gráfica del comportamiento" icon="wave">
            <def.Plot data={data} />
            <div className="formulas">
              {def.formulas.map((f, i) => (
                <code key={i}>{f}</code>
              ))}
            </div>
          </Panel>
        </section>

        <section className="exp__side">
          <Panel
            title="Parámetros"
            icon="gauge"
            right={
              <button type="button" className="btn btn--tiny" onClick={reset}>
                <Icon name="reset" size={13} /> Reiniciar
              </button>
            }
          >
            <div className="sliders">
              {visibleParams.map((pd) =>
                pd.kind === 'toggle' ? (
                  <div key={pd.id} className="slider slider--toggle">
                    <Toggle
                      on={params[pd.id] === 1}
                      onChange={(v) => setParam(pd.id, v ? 1 : 0)}
                      label={pd.label}
                    />
                  </div>
                ) : (
                  <Slider
                    key={pd.id}
                    id={def.id}
                    label={pd.label}
                    symbol={pd.symbol}
                    unit={pd.unit}
                    min={pd.min}
                    max={pd.max}
                    step={pd.step}
                    value={params[pd.id]}
                    decimals={pd.decimals}
                    hint={pd.hint}
                    onChange={(v) => setParam(pd.id, v)}
                  />
                ),
              )}
            </div>
            {def.presets && (
              <div className="presets">
                {def.presets.map((pr) => (
                  <button key={pr.name} type="button" className="chip" onClick={() => applyPreset(pr.params)}>
                    {pr.name}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Ecuación viva" icon="bolt">
            <LiveMath lines={live} />
          </Panel>

          <Panel title="Lecturas" icon="grid">
            <ReadoutGrid items={readouts} />
            {verdict && (
              <div className={`verdict tone-${verdict.tone}`}>
                <Icon name={verdict.tone === 'ok' ? 'check' : verdict.tone === 'bad' ? 'x' : 'info'} size={15} />
                <span>{verdict.text}</span>
              </div>
            )}
          </Panel>

          <Panel
            title="Reto"
            icon="target"
            right={
              <span className={`status ${goalMet ? 'is-done' : ''}`}>
                <Icon name={goalMet ? 'check' : 'lock'} size={12} />
                {goalMet ? 'cumplido' : 'pendiente'}
              </span>
            }
          >
            <div className={`challenge ${goalMet ? 'is-done' : ''}`}>
              <p className="challenge__goal">
                <Icon name="target" size={14} /> {def.challenge.goal}
              </p>
              <p className="challenge__prompt">{def.challenge.prompt}</p>
              <div className="challenge__actions">
                <button type="button" className="btn btn--primary" onClick={validate}>
                  <Icon name={check.pass ? 'check' : 'play'} size={15} /> Validar
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setHintOpen((v) => !v);
                    sfx.click();
                  }}
                >
                  <Icon name="info" size={14} /> {hintOpen ? 'Ocultar pista' : 'Pista'}
                </button>
              </div>
              {hintOpen && <p className="challenge__hint">{def.challenge.hint}</p>}

              <div ref={resultRef}>
                {feedback && (
                  <div className={`feedback ${feedback.pass ? 'is-pass' : 'is-fail'}`}>
                    <Icon name={feedback.pass ? 'check' : 'x'} size={16} />
                    <span>{feedback.detail}</span>
                  </div>
                )}
              </div>

              {justSolved && (
                <div className="solved">
                  <Stars n={earned} />
                  <span>¡Reto resuelto! +1 sello</span>
                </div>
              )}
              <p className="challenge__live">
                Lectura actual: <strong>{check.pass ? 'cumple' : 'no cumple'}</strong> · intentos: {attempts}
              </p>
            </div>
          </Panel>

          {def.notes && (
            <Collapse title="Notas y advertencias del material" icon="info">
              <ul className="notes">
                {def.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </Collapse>
          )}
        </section>
      </div>

      <footer className="exp__foot">
        <button type="button" className="btn btn--ghost" disabled={!prevId} onClick={() => prevId && onGoto(prevId)}>
          <Icon name="arrowLeft" size={15} /> Anterior
        </button>
        <span className="exp__hinttext">
          Ajusta los parámetros y observa cómo cambia {def.num === '14' ? 'el tablero' : 'la escena, la gráfica y las lecturas'} en
          tiempo real.
        </span>
        <button type="button" className="btn btn--primary" disabled={!nextId} onClick={() => nextId && onGoto(nextId)}>
          Siguiente <Icon name="arrowRight" size={15} />
        </button>
      </footer>
    </div>
  );
}

export function prettyNum(v: number) {
  return fmt(v, 2);
}
