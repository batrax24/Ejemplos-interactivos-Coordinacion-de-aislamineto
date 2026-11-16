import { useMemo, useState } from 'react';
import { EXPERIMENTS } from '../experiments';
import type { Progress } from '../lib/storage';
import { sfx } from '../lib/audio';
import { Icon, Stars } from '../components/ui';
import { FUNCION_CHAPTERS, FUNCIONES } from './funciones';
import type { FuncionSpec } from './funciones';
import { THEMES } from './themes';

/**
 * "Defiende": las funciones críticas de la exposición en forma de mapa conceptual.
 *
 * Cada capítulo reúne las afirmaciones que el material considera críticas. Una
 * función se desbloquea resolviendo los experimentos de su bloque; al abrirla,
 * se elige el cierre correcto y se muestra la demostración con el experimento
 * que la respalda.
 */
export function DefendView({
  progress,
  onGoto,
  onSolve,
}: {
  progress: Progress;
  onGoto: (id: string) => void;
  onSolve: (funcionId: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const solved = progress.lab.funciones;

  const total = FUNCIONES.length;
  const chapterDone = (chapterId: string) => {
    const fns = FUNCIONES.filter((f) => f.chapter === chapterId);
    return fns.filter((f) => solved[f.id]).length;
  };

  return (
    <div className="exp defend">
      <header className="exp__head">
        <div className="exp__title">
          <span className="exp__num"></span>
          <div>
            <h2>Defiende: las funciones críticas</h2>
            <p>Las afirmaciones que separan a quien entendió de quien memorizó</p>
          </div>
        </div>
        <div className="defend__count">
          <Icon name="shield" size={15} /> {Object.keys(solved).length}/{total} defendidas
        </div>
      </header>

      <p className="defend__intro">
        Cada tarjeta es una frase que suena razonable y falla en un detalle. Elige el cierre correcto y la
        demostración te lleva al experimento que la prueba. Las tarjetas se desbloquean resolviendo los retos del
        bloque.
      </p>

      {FUNCION_CHAPTERS.map((ch) => {
        const fns = FUNCIONES.filter((f) => f.chapter === ch.id);
        const exps = EXPERIMENTS.filter((e) => fns.some((f) => f.expIds.includes(e.id)));
        const ready = exps.every((e) => progress.exps[e.id]?.done);
        return (
          <section key={ch.id} className="defend__block" style={{ ['--ch' as never]: ch.color } as never}>
            <header className="defend__blockhead">
              <span className="defend__dot" />
              <div>
                <h3>{ch.name}</h3>
                <p>{ch.blurb}</p>
              </div>
              <span className="defend__blockcount">
                {chapterDone(ch.id)}/{fns.length}
              </span>
            </header>
            {!ready && (
              <p className="defend__locknote">
                <Icon name="lock" size={13} /> Se desbloquea al resolver:{' '}
                {exps
                  .filter((e) => !progress.exps[e.id]?.done)
                  .map((e) => `${e.num} ${e.title}`)
                  .join(' · ')}
              </p>
            )}
            <div className="defend__grid">
              {fns.map((f) => (
                <article
                  key={f.id}
                  className={`fcard ${solved[f.id] ? 'is-done' : ''} ${!ready ? 'is-locked' : ''} ${open === f.id ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="fcard__head"
                    disabled={!ready}
                    onClick={() => {
                      setOpen((v) => (v === f.id ? null : f.id));
                      sfx.click();
                    }}
                  >
                    <span className="fcard__icon">
                      <Icon name={f.icon} size={15} />
                    </span>
                    <span className="fcard__title">
                      <em>{f.tema}</em>
                      <strong>{f.titulo}</strong>
                    </span>
                    {solved[f.id] ? <Icon name="check" size={15} /> : ready ? <Icon name="play" size={13} /> : <Icon name="lock" size={13} />}
                  </button>
                  {open === f.id && (
                    <FuncionCard
                      fn={f}
                      done={Boolean(solved[f.id])}
                      onSolve={() => {
                        onSolve(f.id);
                        sfx.success();
                      }}
                      onGoto={onGoto}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FuncionCard({
  fn,
  done,
  onSolve,
  onGoto,
}: {
  fn: FuncionSpec;
  done: boolean;
  onSolve: () => void;
  onGoto: (id: string) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const chosen = fn.options.find((o) => o.id === pick);
  const correct = useMemo(() => fn.options.find((o) => o.ok), [fn]);

  return (
    <div className="fcard__body">
      <p className="fcard__claim">{fn.claim}</p>
      <div className="fcard__options">
        {fn.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`fopt ${pick === o.id ? (o.ok ? 'is-ok' : 'is-bad') : ''} ${pick && o.ok ? 'is-right' : ''}`}
            onClick={() => {
              setPick(o.id);
              if (o.ok) onSolve();
              else sfx.fail();
            }}
          >
            <span className="fopt__mark">{pick === o.id ? (o.ok ? '✓' : '✕') : '·'}</span>
            {o.text}
          </button>
        ))}
      </div>

      {chosen && (
        <div className={`fcard__why ${chosen.ok ? 'is-ok' : 'is-bad'}`}>
          <p>{chosen.why}</p>
          {!chosen.ok && correct && (
            <p className="fcard__fix">
              <Icon name="check" size={13} /> El cierre correcto: «{correct.text}». {correct.why}
            </p>
          )}
        </div>
      )}

      {done && (
        <div className="fcard__demo">
          <p>
            <Icon name="eye" size={14} /> <strong>Demostración:</strong> {fn.demo}
          </p>
          <div className="fcard__actions">
            {fn.expIds.slice(0, 2).map((id) => {
              const e = EXPERIMENTS.find((x) => x.id === id);
              return (
                <button key={id} type="button" className="btn btn--tiny" onClick={() => onGoto(id)}>
                  <Icon name="play" size={12} /> Abrir {e?.num} {e?.title}
                </button>
              );
            })}
          </div>
          <p className="fcard__extra">
            <Icon name="spark" size={13} /> {fn.extra}
          </p>
        </div>
      )}

      {!done && !chosen && (
        <p className="fcard__hint">Elige el cierre que creas correcto. La respuesta se explica aquí mismo.</p>
      )}
    </div>
  );
}

/** Panel compacto para la portada. */
export function DefendSummary({ progress }: { progress: Progress }) {
  const solved = progress.lab.funciones;
  const total = FUNCIONES.length;
  const n = Object.keys(solved).length;
  const missions = Object.keys(progress.lab.missions).length;
  const stars = n === total ? 3 : n >= total * 0.7 ? 2 : n > 0 ? 1 : 0;
  return (
    <div className="defendsum">
      <div className="defendsum__item">
        <span className="defendsum__num">{n}/{total}</span>
        <span className="defendsum__label">funciones defendidas</span>
      </div>
      <div className="defendsum__item">
        <span className="defendsum__num">{missions}/{THEMES.length}</span>
        <span className="defendsum__label">misiones de guardia</span>
      </div>
      <div className="defendsum__item">
        <Stars n={stars} />
        <span className="defendsum__label">sello de defensor</span>
      </div>
    </div>
  );
}
