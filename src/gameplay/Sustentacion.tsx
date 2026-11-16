import { useEffect, useMemo, useState } from 'react';
import { EXPERIMENTS } from '../experiments';
import { sfx } from '../lib/audio';
import { Icon, Pill } from '../components/ui';
import { ETAPAS, etapaSpec, revisar, ronda, rondaSize } from './defensa';
import type { Pregunta } from './defensa';

/**
 * Simulacro de sustentación.
 *
 * Cuatro niveles (conceptual, matemático, crítico y examen final de diez
 * preguntas). Cada ronda exige una nota mínima; el resultado se puede reintentar
 * con otra mezcla. El avance y el récord de cada nivel se guardan.
 */
export function Sustentacion({
  defense,
  best,
  onPass,
  onScore,
  onGoto,
}: {
  defense: number;
  /** Mejor nota por nivel (aciertos). */
  best: Record<string, number>;
  onPass: (etapa: number) => void;
  onScore: (etapa: number, hits: number) => void;
  onGoto: (id: string) => void;
}) {
  const [etapa, setEtapa] = useState(Math.min(ETAPAS.length, defense + 1));
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const preguntas = useMemo(() => ronda(etapa, seed), [etapa, seed]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const spec = etapaSpec(etapa);
  const q = preguntas[idx];
  const answered = q ? answers[q.id] : undefined;
  const isChecked = q ? Boolean(checked[q.id]) : false;
  const verdict = q && isChecked ? revisar(q, answered ?? '') : null;

  const hits = preguntas.filter((p) => checked[p.id] && revisar(p, answers[p.id] ?? '').ok).length;
  const totalChecked = preguntas.filter((p) => checked[p.id]).length;
  const pass = hits >= spec.min && totalChecked === preguntas.length;

  // Al cerrar la ronda se registra la nota, apruebe o no.
  useEffect(() => {
    if (!done) return;
    onScore(etapa, hits);
    if (hits >= spec.min) onPass(etapa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const choose = (v: string | number) => {
    if (isChecked) return;
    setAnswers((a) => ({ ...a, [q.id]: v }));
    sfx.tick();
  };

  const check = () => {
    if (answered === undefined || isChecked) return;
    const r = revisar(q, answered);
    setChecked((c) => ({ ...c, [q.id]: true }));
    if (r.ok) sfx.success();
    else sfx.fail();
  };

  const next = () => {
    if (idx < preguntas.length - 1) setIdx(idx + 1);
    else setDone(true);
  };

  const restart = (nuevaEtapa: number) => {
    setEtapa(nuevaEtapa);
    setSeed(Math.floor(Math.random() * 1e6));
    setIdx(0);
    setAnswers({});
    setChecked({});
    setDone(false);
  };

  const stageLocked = (n: number) => n > defense + 1;

  return (
    <div className="exp sust">
      <header className="exp__head">
        <div className="exp__title">
          <span className="exp__num">Σ</span>
          <div>
            <h2>Simulacro de sustentación</h2>
            <p>Cuatro niveles · preguntas mezcladas de los siete temas, cálculo y repreguntas</p>
          </div>
        </div>
        <div className="sust__score">
          <Icon name="trophy" size={15} /> {hits}/{preguntas.length} en esta ronda
          {best[String(etapa)] !== undefined && (
            <span className="sust__record">récord {best[String(etapa)]}/{rondaSize(etapa)}</span>
          )}
        </div>
      </header>

      <div className="sust__stages">
        {ETAPAS.map((e) => (
          <button
            key={e.n}
            type="button"
            className={`sust__stage ${etapa === e.n ? 'is-active' : ''} ${defense >= e.n ? 'is-passed' : ''}`}
            disabled={stageLocked(e.n)}
            onClick={() => restart(e.n)}
          >
            <span className="mono">Nivel {e.n}</span>
            <strong>{e.name}</strong>
            <em>{stageLocked(e.n) ? 'Se abre al aprobar el nivel anterior' : e.blurb}</em>
            <span className="sust__stagereq">
              {e.size} preguntas · {e.min} para aprobar
            </span>
            {defense >= e.n && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>

      {!done && q && (
        <div className="sust__card">
          <div className="sust__meta">
            <Pill tone="info">{q.tema}</Pill>
            <span className="sust__progress">
              Pregunta {idx + 1} de {preguntas.length}
            </span>
            <span className="sust__dots">
              {preguntas.map((p, i) => (
                <span
                  key={p.id}
                  className={`sust__dot ${i === idx ? 'is-now' : ''} ${checked[p.id] ? (revisar(p, answers[p.id] ?? '').ok ? 'is-ok' : 'is-bad') : ''}`}
                />
              ))}
            </span>
          </div>

          <p className="sust__prompt">{q.prompt}</p>

          {q.kind === 'calculo' ? (
            <div className="sust__calc">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Escribe el número"
                value={answers[q.id] === undefined ? '' : String(answers[q.id])}
                onChange={(e) => choose(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || answered === undefined) return;
                  if (isChecked) next();
                  else check();
                }}
                disabled={isChecked}
                aria-label="Respuesta numérica"
              />
              <span className="sust__unit">{q.unit}</span>
            </div>
          ) : (
            <div className="sust__options">
              {q.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`sust__opt ${answered === o.id ? 'is-sel' : ''} ${
                    isChecked && o.ok ? 'is-right' : isChecked && answered === o.id ? 'is-wrong' : ''
                  }`}
                  onClick={() => choose(o.id)}
                  disabled={isChecked}
                >
                  {o.text}
                </button>
              ))}
            </div>
          )}

          {verdict && (
            <div className={`sust__verdict ${verdict.ok ? 'is-ok' : 'is-bad'}`}>
              <p>
                <Icon name={verdict.ok ? 'check' : 'x'} size={15} />{' '}
                <strong>{verdict.ok ? 'Correcto.' : 'No era eso.'}</strong> {verdict.why}
              </p>
              {verdict.ok && q.kind === 'calculo' && (
                <div className="sust__reask">
                  <p className="sust__reasklabel">
                    <Icon name="info" size={13} /> El profesor repregunta
                  </p>
                  <p>{q.repregunta.prompt}</p>
                  <div className="sust__options">
                    {q.repregunta.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`sust__opt ${
                          answers[`${q.id}-rp`] === o.id ? (o.ok ? 'is-right' : 'is-wrong') : ''
                        }`}
                        onClick={() => {
                          setAnswers((a) => ({ ...a, [`${q.id}-rp`]: o.id }));
                          if (!o.ok) sfx.fail();
                          else sfx.click();
                        }}
                      >
                        {o.text}
                      </button>
                    ))}
                  </div>
                  {answers[`${q.id}-rp`] !== undefined && <p className="sust__reaskwhy">{q.repregunta.why}</p>}
                </div>
              )}
              <div className="sust__actions">
                {q.expIds.length > 0 && (
                  <button type="button" className="btn btn--ghost btn--tiny" onClick={() => onGoto(q.expIds[0])}>
                    <Icon name="play" size={12} /> Ver en el laboratorio
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="sust__footer">
            <span className="sust__hint">
              {q.kind === 'calculo'
                ? 'Tolerancia ±1–4 %: se acepta coma o punto decimal.'
                : 'Una sola respuesta es correcta.'}
            </span>
            {!isChecked ? (
              <button type="button" className="btn btn--primary" onClick={check} disabled={answered === undefined}>
                <Icon name="check" size={15} /> Responder
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={next}>
                {idx < preguntas.length - 1 ? 'Siguiente' : 'Cerrar ronda'} <Icon name="arrowRight" size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className={`sust__result ${pass ? 'is-ok' : 'is-bad'}`}>
          <div className="sust__resulhead">
            <Icon name={pass ? 'check' : 'x'} size={20} />
            <h3>
              {pass ? `Nivel ${etapa} aprobado` : `Nivel ${etapa}: ${hits} de ${preguntas.length}`}
            </h3>
            <span className="sust__resultreq">
              mínimo {spec.min}/{preguntas.length}
            </span>
          </div>
          <p>
            {pass
              ? etapa < ETAPAS.length
                ? 'Siguiente nivel desbloqueado. El documento recomienda no saltarse el conceptual: sin él, la fórmula se memoriza y no se defiende.'
                : 'Los cuatro niveles superados: dominas el tema y puedes explicarlo con criterio, que es el cierre que pide el material.'
              : 'Revisa las explicaciones y vuelve a intentarlo con otra mezcla. Cada error tiene abajo la cuenta y el porqué.'}
          </p>
          <ul className="sust__review">
            {preguntas.map((p: Pregunta) => {
              const r = checked[p.id] ? revisar(p, answers[p.id] ?? '') : { ok: false, why: 'Sin responder.' };
              return (
                <li key={p.id} className={r.ok ? 'ok' : 'bad'}>
                  <Icon name={r.ok ? 'check' : 'x'} size={13} />
                  <div>
                    <strong>{p.tema}</strong>
                    <span>{p.prompt.length > 130 ? `${p.prompt.slice(0, 130)}…` : p.prompt}</span>
                    <em>{r.why}</em>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sust__actions">
            <button type="button" className="btn btn--primary" onClick={() => restart(etapa)}>
              <Icon name="reset" size={14} /> Otra ronda del nivel {etapa}
            </button>
            {pass && etapa < ETAPAS.length && (
              <button type="button" className="btn btn--ghost" onClick={() => restart(etapa + 1)}>
                Pasar al nivel {etapa + 1} <Icon name="arrowRight" size={14} />
              </button>
            )}
            {pass && etapa === ETAPAS.length && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onGoto(EXPERIMENTS[EXPERIMENTS.length - 1].id)}
              >
                <Icon name="target" size={14} /> Volver a la misión final
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Barra compacta para la portada. */
export function SustResumen({ defense }: { defense: number }) {
  return (
    <div className="sust__bar">
      {ETAPAS.map((e) => (
        <div key={e.n} className={`sust__baritem ${defense >= e.n ? 'is-ok' : ''}`}>
          <span>{e.n}</span>
          <div>
            <strong>{e.name}</strong>
            <em>{defense >= e.n ? 'aprobado' : 'pendiente'}</em>
          </div>
        </div>
      ))}
    </div>
  );
}
