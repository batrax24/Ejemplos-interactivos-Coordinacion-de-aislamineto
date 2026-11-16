import { CHAPTERS, EXPERIMENTS } from '../experiments';
import type { Progress } from '../lib/storage';
import { rankFor } from '../lib/storage';
import { Icon, Stars } from './ui';
import { FUNCIONES } from '../gameplay/funciones';
import { ETAPAS } from '../gameplay/defensa';
import { sfx } from '../lib/audio';

const CHAPTER_ICON: Record<string, string> = {
  esfuerzos: 'bolt',
  ambiente: 'tower',
  proteccion: 'shield',
  sintesis: 'trophy',
};

interface Props {
  progress: Progress;
  onGoto: (id: string) => void;
  onStart: () => void;
  onTour: () => void;
  /** Paneles de juego (funciones y sustentación) que se insertan antes de los bloques. */
  extra?: React.ReactNode;
  onDefiende?: () => void;
  onSustenta?: () => void;
  /** Respaldo del avance: descargar, importar y reiniciar. */
  onExport?: () => void;
  onImport?: (file: File) => void;
  onReset?: () => void;
}

export function LabHome({
  progress,
  onGoto,
  onStart,
  onTour,
  extra,
  onDefiende,
  onSustenta,
  onExport,
  onImport,
  onReset,
}: Props) {
  const total = EXPERIMENTS.length;
  const done = EXPERIMENTS.filter((e) => progress.exps[e.id]?.done).length;
  const { rank, next, prog, idx } = rankFor(progress.xp);
  const pct = Math.round((done / total) * 100);
  const nextExp = EXPERIMENTS.find((e) => !progress.exps[e.id]?.done) ?? EXPERIMENTS[0];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">
            <Icon name="bolt" size={14} /> Laboratorio interactivo · 120 minutos de clase
          </p>
          <h1>
            Coordinación de
            <br />
            <span className="grad">aislamiento</span>
          </h1>
          <p className="hero__lead">
            Mueve los parámetros de las ecuaciones del material y observa, en la misma pantalla, cómo cambian la escena,
            la gráfica y el veredicto técnico. {total} experimentos con retos, récords y una misión final.
          </p>
          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                sfx.levelUnlock();
                onStart();
              }}
            >
              <Icon name="play" size={17} /> {done > 0 ? 'Continuar' : 'Empezar'} · {nextExp.num}
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={onTour}>
              <Icon name="info" size={17} /> Cómo funciona
            </button>
          </div>
          <div className="hero__progress">
            <div className="hero__bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <p>
              <strong>{done}</strong> / {total} sellos · <strong>{progress.xp}</strong> XP · rango:{' '}
              <em>{rank.name}</em>
              {next && <span className="hero__next"> (faltan {next.min - progress.xp} XP para {next.name})</span>}
            </p>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="orb orb--1" />
          <div className="orb orb--2" />
          <div className="hero__tower">
            <svg viewBox="0 0 300 340" className="tower-svg">
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7fe9ff" />
                  <stop offset="100%" stopColor="#2ee6a8" />
                </linearGradient>
                <filter id="tglow">
                  <feGaussianBlur stdDeviation="3.4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g stroke="url(#tg)" strokeWidth="1.6" fill="none" filter="url(#tglow)" opacity="0.9">
                <path d="M94 320 L132 52 M206 320 L168 52" />
                {Array.from({ length: 10 }, (_, i) => {
                  const f0 = i / 10;
                  const f1 = (i + 1) / 10;
                  const y0 = 320 - f0 * 268;
                  const y1 = 320 - f1 * 268;
                  const w0 = 56 - 38 * f0;
                  const w1 = 56 - 38 * f1;
                  return (
                    <g key={i}>
                      <path d={`M${150 - w1} ${y1} L${150 + w0} ${y0}`} opacity="0.45" />
                      <path d={`M${150 + w1} ${y1} L${150 - w0} ${y0}`} opacity="0.45" />
                    </g>
                  );
                })}
                <path d="M78 96 L222 96" />
                <path d="M92 140 L208 140" />
                <path d="M150 52 L150 28" />
              </g>
              <g fill="#0b1a2b" stroke="#7fe9ff" strokeWidth="1.4">
                {Array.from({ length: 7 }, (_, i) => (
                  <ellipse key={i} cx={78} cy={102 + i * 11} rx={12} ry={2.6} />
                ))}
                {Array.from({ length: 7 }, (_, i) => (
                  <ellipse key={`b${i}`} cx={222} cy={102 + i * 11} rx={12} ry={2.6} />
                ))}
              </g>
              <path d="M40 108 Q150 130 262 108" stroke="#38e1ff" strokeWidth="2.2" fill="none" opacity="0.85" />
              <circle cx={78} cy={180} r={4} fill="#ffc247" />
              <circle cx={222} cy={180} r={4} fill="#b48cff" />
              <text x={150} y={330} textAnchor="middle" fill="#7f9ab8" fontSize="10" fontFamily="monospace">
                245 kV · 21 discos · δ 0,74
              </text>
            </svg>
          </div>
        </div>
      </section>

      {(extra || onDefiende || onSustenta || onExport || onImport || onReset) && (
        <section className="gamehub">
          <header className="gamehub__head">
            <p className="gamehub__kicker">
              <Icon name="shield" size={14} /> Después de explorar
            </p>
            <h2>Entender no es mover sliders</h2>
            <p>
              Dos piezas convierten los {total} experimentos en criterio: <strong>Defiende</strong> pone a prueba las{' '}
              {FUNCIONES.length} funciones críticas de la exposición y <strong>Sustentación</strong> simula el examen con
              preguntas aleatorias de los siete temas, cálculo y repreguntas.
            </p>
          </header>
          <div className="gamehub__grid">
            {onDefiende && (
              <button type="button" className="gamehub__card gamehub__card--defiende" onClick={onDefiende}>
                <span className="gamehub__icon">
                  <Icon name="shield" size={22} />
                </span>
                <strong>Defiende</strong>
                <em>{FUNCIONES.length} funciones · 4 bloques</em>
                <p>
                  Afirmaciones que suenan bien y fallan en un detalle. Elige el cierre correcto y abre el experimento
                  que lo demuestra.
                </p>
                <span className="gamehub__cta">
                  <Icon name="arrowRight" size={14} /> Abrir el mapa
                </span>
              </button>
            )}
            {onSustenta && (
              <button type="button" className="gamehub__card gamehub__card--sustenta" onClick={onSustenta}>
                <span className="gamehub__icon">
                  <Icon name="trophy" size={22} />
                </span>
                <strong>Sustentación</strong>
                <em>{ETAPAS.length} niveles · hasta 10 preguntas por ronda</em>
                <p>
                  Conceptual, matemático, crítico y examen final. Cálculo con tolerancia, repreguntas del profesor y
                  casos de diagnóstico.
                </p>
                <span className="gamehub__cta">
                  <Icon name="arrowRight" size={14} /> Empezar simulacro
                </span>
              </button>
            )}
          </div>
          {extra}
          {(onExport || onImport || onReset) && (
            <div className="backup">
              <div className="backup__text">
                <strong>Tu avance, a salvo</strong>
                <p>
                  El progreso vive en este navegador. Descárgalo antes de cambiar de equipo o de limpiar los datos del
                  sitio; después puedes importarlo y seguir donde ibas.
                </p>
              </div>
              <div className="backup__actions">
                {onExport && (
                  <button type="button" className="btn btn--ghost btn--tiny" onClick={onExport}>
                    <Icon name="arrowRight" size={13} /> Descargar progreso
                  </button>
                )}
                {onImport && (
                  <label className="btn btn--ghost btn--tiny backup__file">
                    <Icon name="reset" size={13} /> Importar
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onImport(f);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                )}
                {onReset && (
                  <button type="button" className="btn btn--ghost btn--tiny backup__danger" onClick={onReset}>
                    <Icon name="x" size={13} /> Reiniciar
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="chapters">
        {CHAPTERS.map((ch, ci) => {
          const exps = ch.ids.map((id) => EXPERIMENTS.find((e) => e.id === id)!).filter(Boolean);
          const doneCh = exps.filter((e) => progress.exps[e.id]?.done).length;
          return (
            <section key={ch.id} className="chapter" style={{ ['--ch' as never]: ch.color } as never}>
              <header className="chapter__head">
                <div className="chapter__icon">
                  <Icon name={CHAPTER_ICON[ch.id]} size={17} />
                </div>
                <div>
                  <p className="chapter__kicker">
                    Bloque {ci + 1} · {ch.range}
                  </p>
                  <h3>{ch.name}</h3>
                  <p className="chapter__sub">{ch.subtitle}</p>
                </div>
                <span className="chapter__count">
                  {doneCh}/{exps.length}
                </span>
              </header>
              <div className="chapter__cards">
                {exps.map((e) => {
                  const pr = progress.exps[e.id];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`card ${pr?.done ? 'is-done' : ''}`}
                      onClick={() => {
                        sfx.nav();
                        onGoto(e.id);
                      }}
                    >
                      <div className="card__top">
                        <span className="card__num">{e.num}</span>
                        {pr?.done ? (
                          <Stars n={pr.stars} />
                        ) : (
                          <span className="card__open">
                            abrir <Icon name="arrowRight" size={12} />
                          </span>
                        )}
                      </div>
                      <h4>{e.title}</h4>
                      <p>{e.kicker}</p>
                      <code>{e.formulas[0]}</code>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="ranks">
        <h3>
          <Icon name="trophy" size={17} /> Progresión
        </h3>
        <div className="ranks__bar">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={i <= idx ? 'on' : ''} />
          ))}
        </div>
        <p className="ranks__now">
          <strong>{rank.name}</strong> · {progress.xp} XP
          {next && ` · siguiente: ${next.name} (${next.min} XP)`}
        </p>
        <p className="ranks__prog" style={{ width: `${prog * 100}%` }} />
      </section>
    </div>
  );
}
