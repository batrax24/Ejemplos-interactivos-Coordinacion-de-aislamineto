import { useMemo, useState } from 'react';
import type { ExperimentDef, Params } from '../experiments/types';
import { fmt } from '../lib/num';
import { sfx } from '../lib/audio';
import { Icon, Pill } from '../components/ui';
import { evaluateDay, forecastScore, merge } from './types';
import type { CaseResult, Picks } from './types';
import type { ThemeSpec } from './themes';
import { TARGETS } from './targets';

/** Marca de "no tocar el diseño": no es una medida, es una decisión. */
const KEEP = 'keep';

/**
 * Un día de guardia.
 *
 * 1. Diagnóstico: ¿este caso va a fallar o va a sostener?
 * 2. Medida: una decisión por caso, tomada del maletín.
 * 3. Informe: qué casos quedaron desprotegidos y por qué.
 *
 * La escena, la gráfica y los criterios se recalculan con la medida elegida: el
 * juego enseña la cuenta, no la esconde. La trampa está en que algunas medidas
 * mejoran el número sin cambiar la física (bajar el requisito, cambiar la
 * convención, medir otra cosa): esas no cuentan como protección.
 */
export function GameDay({
  theme,
  def,
  onExit,
  onDefend,
  onDraft,
  draft,
  defended,
}: {
  theme: ThemeSpec;
  def: ExperimentDef<never>;
  onExit: () => void;
  onDefend: (themeId: string, score: number) => void;
  /** Guarda el borrador de medidas para no perderlo al salir. */
  onDraft?: (themeId: string, picks: Record<string, string>) => void;
  draft?: Record<string, string>;
  defended: boolean;
}) {
  const spec = theme.daily;
  // El borrador guardado se descarta si menciona casos que ya no existen.
  const [picks, setPicks] = useState<Picks>(() => {
    const validos = Object.entries(draft ?? {}).filter(([id]) => spec.cases.some((c) => c.id === id));
    return Object.fromEntries(validos);
  });
  const [forecast, setForecast] = useState<Record<string, 'falla' | 'sostiene' | undefined>>({});
  const [submitted, setSubmitted] = useState(false);
  const [openCase, setOpenCase] = useState<string>(spec.cases[0]?.id ?? '');

  const report = useMemo(() => evaluateDay(spec, TARGETS, picks), [spec, picks]);
  const fc = useMemo(() => forecastScore(spec, forecast), [spec, forecast]);
  const casesById = useMemo(() => Object.fromEntries(report.cases.map((c) => [c.spec.id, c])), [report]);

  const active = spec.cases.find((c) => c.id === openCase) ?? spec.cases[0];
  const option = active ? picks[active.id] : undefined;
  const current = active ? casesById[active.id] : undefined;

  /** Parámetros vivos: el caso con la medida aplicada ("keep" = tal cual). */
  const liveParams: Params | null = useMemo(() => {
    if (!active) return null;
    const opt = option === KEEP ? undefined : spec.options.find((o) => o.id === option);
    return opt ? merge(active.params, opt.apply(active.params)) : { ...active.params };
  }, [active, option, spec.options]);

  const data = useMemo(() => (liveParams ? def.compute(liveParams as never) : null), [def, liveParams]);

  const decide = (id: string, v: 'falla' | 'sostiene') => {
    sfx.click();
    setForecast((prev) => ({ ...prev, [id]: prev[id] === v ? undefined : v }));
  };

  const pick = (id: string, optionId: string) => {
    sfx.click();
    setPicks((prev) => {
      const next: Picks = { ...prev, [id]: prev[id] === optionId ? undefined : optionId };
      const clean = Object.fromEntries(
        Object.entries(next).filter(([, v]) => Boolean(v)) as [string, string][],
      );
      onDraft?.(theme.id, clean);
      return next;
    });
    setSubmitted(false);
  };

  const send = () => {
    const next = evaluateDay(spec, TARGETS, picks);
    setSubmitted(true);
    if (next.valid) {
      sfx.levelUnlock();
      onDefend(theme.id, next.score);
    } else {
      sfx.fail();
    }
  };

  const missing = spec.cases.filter((c) => !picks[c.id]).length;

  return (
    <div className="mission">
      <header className="mission__head">
        <div>
          <p className="mission__kicker">
            <Icon name="shield" size={13} /> Misión {theme.num} · día de guardia
            {defended && (
              <span className="mission__done">
                <Icon name="check" size={12} /> superada
              </span>
            )}
          </p>
          <h3>{spec.mission}</h3>
          <p className="mission__brief">{spec.brief}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--tiny" onClick={onExit}>
          <Icon name="arrowLeft" size={13} /> Volver a explorar
        </button>
      </header>

      <div className="mission__tabs" role="tablist" aria-label="Casos del día">
        {spec.cases.map((c, i) => {
          const r = casesById[c.id];
          const done = Boolean(picks[c.id]);
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === openCase}
              className={`mission__tab ${c.id === openCase ? 'is-open' : ''} ${submitted ? (r.pass ? 'is-pass' : 'is-fail') : ''}`}
              onClick={() => {
                setOpenCase(c.id);
                sfx.click();
              }}
            >
              <span className="mono">C{i + 1}</span>
              <span className="mission__tabname">{c.name}</span>
              {done && <Icon name={submitted ? (r.pass ? 'check' : 'x') : 'target'} size={13} />}
            </button>
          );
        })}
      </div>

      {active && current && liveParams && data && (
        <>
          <p className="mission__casebrief">{active.brief}</p>

          {active.forecast && (
            <div className="mission__step">
              <p className="mission__stephead">
                <span className="mission__stepnum">1</span> Diagnóstico: antes de calcular, ¿qué esperas?
              </p>
              <div className="mission__forecast">
                <button
                  type="button"
                  className={`decision ${forecast[active.id] === 'falla' ? 'is-sel is-bad' : ''}`}
                  onClick={() => decide(active.id, 'falla')}
                >
                  <Icon name="flame" size={16} />
                  <span>Va a fallar</span>
                  <em>el esfuerzo supera la capacidad</em>
                </button>
                <button
                  type="button"
                  className={`decision ${forecast[active.id] === 'sostiene' ? 'is-sel is-ok' : ''}`}
                  onClick={() => decide(active.id, 'sostiene')}
                >
                  <Icon name="check" size={16} />
                  <span>Va a sostener</span>
                  <em>hay margen con los datos dados</em>
                </button>
              </div>
            </div>
          )}

          <div className="mission__stage">
            <div className="stage">
              <div className="stage__badge">Escena con la medida aplicada</div>
              <def.Scene data={data as never} />
            </div>
            <div className="mission__plots">
              <def.Plot data={data as never} />
            </div>
          </div>

          <div className="mission__criteria">
            {current.goals.map((g) => (
              <div key={g.target.id} className={`criterion ${g.pass ? 'is-ok' : 'is-bad'}`}>
                <div className="criterion__top">
                  <span className="criterion__label">{g.target.label}</span>
                  <Pill tone={g.pass ? 'ok' : 'bad'}>
                    {fmt(g.result.reserve, 2)} {g.target.unit}
                  </Pill>
                </div>
                <code className="criterion__math">{g.result.detail}</code>
                <p className="criterion__meaning">{g.target.meaning}</p>
              </div>
            ))}
          </div>

          <div className="mission__step">
            <p className="mission__stephead">
              <span className="mission__stepnum">2</span> Medida para este caso
            </p>
            <div className="toolbox">
              <button
                type="button"
                className={`tool tool--keep ${option === undefined ? 'is-sel' : ''}`}
                onClick={() => pick(active.id, KEEP)}
              >
                <span className="tool__icon">
                  <Icon name="check" size={16} />
                </span>
                <span className="tool__text">
                  <strong>Mantener el diseño actual</strong>
                  <em>Si el caso ya cumple, no hace falta tocar nada.</em>
                </span>
                {option === undefined && <Icon name="check" size={15} />}
              </button>
              {spec.options.map((o) => {
                const locked = (active.locked ?? []).includes(o.id);
                const selected = option === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`tool ${selected ? 'is-sel' : ''} ${locked ? 'is-locked' : ''}`}
                    onClick={() => !locked && pick(active.id, o.id)}
                    disabled={locked}
                    title={locked ? 'No disponible en este caso' : o.effect}
                  >
                    <span className="tool__icon">
                      <Icon name={o.icon} size={16} />
                    </span>
                    <span className="tool__text">
                      <strong>{o.label}</strong>
                      <em>{locked ? 'No disponible aquí' : o.effect}</em>
                    </span>
                    {selected && <Icon name="check" size={15} />}
                  </button>
                );
              })}
            </div>
            <p className="mission__hintline">
              Las lecturas se actualizan con la medida. Que el número mejore no significa que la medida proteja:
              algunas solo cambian el criterio o el punto de medida.
            </p>
          </div>
        </>
      )}

      <div className="mission__send">
        <div className="mission__progress">
          <div className="mission__bar">
            <span style={{ width: `${(Object.values(picks).filter(Boolean).length / spec.cases.length) * 100}%` }} />
          </div>
          <span className="mission__barpct">
            {Object.values(picks).filter(Boolean).length}/{spec.cases.length} casos decididos
          </span>
        </div>
        <button type="button" className="btn btn--primary" onClick={send} disabled={missing > 0}>
          <Icon name="play" size={15} /> Enviar jornada
          {missing > 0 && <span className="mission__pending">faltan {missing}</span>}
        </button>
        {submitted && (
          <div className={`report ${report.valid ? 'is-ok' : 'is-bad'}`} role="status">
            <div className="report__head">
              <Icon name={report.valid ? 'check' : 'x'} size={18} />
              <strong>
                {report.valid
                  ? 'Jornada válida: ningún caso quedó desprotegido.'
                  : `${report.incidents} de ${report.cases.length} casos con incidente`}
              </strong>
              <span className="report__score">{report.score}/100</span>
            </div>
            <div className="report__bars">
              <span>
                <strong>{report.cleanFixes}</strong> resueltos con medida física
              </span>
              <span>
                <strong>{report.kept}</strong> casos que ya cumplían y se conservaron
              </span>
              {fc.total > 0 && (
                <span>
                  diagnóstico previo: <strong>{fc.hits}/{fc.total}</strong>
                </span>
              )}
            </div>
            <ul className="report__list">
              {report.cases.map((c: CaseResult) => {
                const fake = c.goals.find((g) => g.fake);
                return (
                  <li key={c.spec.id} className={c.pass ? 'ok' : 'bad'}>
                    <Icon name={c.pass ? 'check' : 'x'} size={14} />
                    <div>
                      <strong>{c.spec.name}</strong>
                      {c.pass ? (
                        <span> — protegido con «{c.goals[0]?.option?.label ?? 'la instalación de partida'}».</span>
                      ) : (
                        <>
                          <span>
                            {' '}
                            — {fake ? 'medida sin efecto físico' : 'sigue sin cumplir'}.
                          </span>
                          <em className="report__lesson">{c.spec.lesson}</em>
                        </>
                      )}
                      {fake && (
                        <em className="report__fake">
                          «{fake.option?.label}» no cambia la física del fenómeno: {fake.option?.falseProtection}
                        </em>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="report__debrief">{report.valid ? spec.debrief.good : spec.debrief.bad}</p>
            <p className="report__tip">
              <strong>Para la sustentación:</strong> {spec.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
