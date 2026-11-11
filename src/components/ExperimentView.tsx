import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentDef, Params } from '../experiments/types';
import { defaults } from '../experiments/types';
import { fmt } from '../lib/num';
import { sfx } from '../lib/audio';
import { Collapse, Icon, LiveMath, Panel, ReadoutGrid, Slider, Stars, Toggle } from './ui';

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
}: Props) {
  const [params, setParams] = useState<Params>(() => defaults(def.params));
  const [hintOpen, setHintOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ pass: boolean; detail: string } | null>(null);
  const [justSolved, setJustSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Reinicia al cambiar de experimento
  useEffect(() => {
    setParams(defaults(def.params));
    setFeedback(null);
    setHintOpen(false);
    setJustSolved(false);
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
