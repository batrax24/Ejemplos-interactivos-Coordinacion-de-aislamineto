import { useEffect, useMemo, useState } from 'react';
import { EXPERIMENTS } from './experiments';
import { ExperimentView } from './components/ExperimentView';
import { LabHome } from './components/LabHome';
import { IntroModal } from './components/IntroModal';
import { Icon } from './components/ui';
import {
  exportProgress,
  importProgress,
  loadProgressDetailed,
  rankFor,
  saveProgress,
  type Progress,
} from './lib/storage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { sfx } from './lib/audio';
import { DefendSummary, DefendView } from './gameplay/DefendView';
import { FUNCIONES } from './gameplay/funciones';
import { ETAPAS } from './gameplay/defensa';
import { Sustentacion, SustResumen } from './gameplay/Sustentacion';

const XP_BY_STARS = [0, 120, 170, 220];

/** Tema de guardia asociado a un experimento. */
const THEME_FOR = (id: string) => ({ disrupcion: 'mecanismos', cadena: 'cadena', oscilacion: 'separacion', guarda: 'guarda', tierra: 'tierra', pararrayos: 'pararrayos', corona: 'corona' })[id];

export function App() {
  const [boot] = useState(() => loadProgressDetailed());
  const [progress, setProgress] = useState<Progress>(() => boot.progress);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'lab' | 'defiende' | 'sustentacion'>('lab');
  const [showIntro, setShowIntro] = useState(() => !boot.progress.seenIntro);
  const [toast, setToast] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    boot.recovered
      ? 'El guardado estaba dañado: recuperamos tu última copia de seguridad.'
      : null,
  );

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    sfx.setEnabled(progress.enabledAudio);
  }, [progress.enabledAudio]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const copy = (text: string) => {
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  const doExport = () => {
    const data = exportProgress(progress);
    copy(data);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `labca-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Progreso descargado y copiado al portapapeles');
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const next = importProgress(String(reader.result ?? ''));
      if (!next) {
        setToast('Ese archivo no parece un progreso de LAB·CA');
        return;
      }
      setProgress({ ...next, seenIntro: true });
      setNotice('Progreso importado. Tu avance anterior queda reemplazado.');
      setToast('Progreso importado');
    };
    reader.readAsText(file);
  };

  const doReset = () => {
    if (!window.confirm('¿Reiniciar todo el progreso? Se borran XP, sellos, misiones y niveles.')) return;
    setProgress({
      xp: 0,
      seenIntro: true,
      enabledAudio: progress.enabledAudio,
      exps: {},
      lab: { missions: {}, funciones: {}, defense: 0, drafts: {}, defenseBest: {} },
    });
    setNotice(null);
    setToast('Progreso reiniciado');
  };

  const activeIdx = useMemo(() => EXPERIMENTS.findIndex((e) => e.id === activeId), [activeId]);
  const active = activeIdx >= 0 ? EXPERIMENTS[activeIdx] : null;

  const goto = (id: string) => {
    setActiveId(id);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      /* entornos sin scroll (p. ej. pruebas) */
    }
  };

  const complete = (id: string, stars: number) => {
    setProgress((prev) => {
      const old = prev.exps[id];
      const gained = old?.done ? 0 : XP_BY_STARS[stars] ?? 120;
      return {
        ...prev,
        xp: prev.xp + gained,
        exps: {
          ...prev.exps,
          [id]: {
            done: true,
            stars: Math.max(old?.stars ?? 0, stars),
            attempts: old?.attempts ?? 0,
            bestError: old?.bestError ?? null,
          },
        },
      };
    });
  };

  const attempt = (id: string) => {
    setProgress((prev) => {
      const old = prev.exps[id];
      return {
        ...prev,
        exps: {
          ...prev.exps,
          [id]: {
            done: old?.done ?? false,
            stars: old?.stars ?? 0,
            attempts: (old?.attempts ?? 0) + 1,
            bestError: old?.bestError ?? null,
          },
        },
      };
    });
  };

  const defend = (themeId: string, score: number) => {
    let gana = 0;
    setProgress((prev) => {
      const old = prev.lab.missions[themeId] ?? 0;
      gana = old === 0 ? 180 : score > old ? 40 : 0;
      return {
        ...prev,
        xp: prev.xp + gana,
        lab: {
          ...prev.lab,
          missions: { ...prev.lab.missions, [themeId]: Math.max(old, score) },
        },
      };
    });
    if (gana > 0) setToast(gana >= 180 ? 'Misión superada: +180 XP' : 'Mejor puntaje: +40 XP');
  };

  const solveFuncion = (id: string) => {
    setProgress((prev) => {
      if (prev.lab.funciones[id]) return prev;
      return {
        ...prev,
        xp: prev.xp + 60,
        lab: { ...prev.lab, funciones: { ...prev.lab.funciones, [id]: 1 } },
      };
    });
  };

  const guardarBorrador = (themeId: string, picks: Record<string, string>) => {
    setProgress((prev) => ({
      ...prev,
      lab: { ...prev.lab, drafts: { ...prev.lab.drafts, [themeId]: picks } },
    }));
  };

  const guardarNota = (n: number, hits: number) => {
    setProgress((prev) => {
      const old = prev.lab.defenseBest[String(n)] ?? -1;
      if (hits <= old) return prev;
      return {
        ...prev,
        lab: { ...prev.lab, defenseBest: { ...prev.lab.defenseBest, [String(n)]: hits } },
      };
    });
  };

  const passEtapa = (n: number) => {
    let suma = 0;
    setProgress((prev) => {
      if (prev.lab.defense >= n) return prev;
      suma = 200;
      return { ...prev, xp: prev.xp + 200, lab: { ...prev.lab, defense: n } };
    });
    if (suma > 0) setToast(`Nivel ${n} de sustentación aprobado: +200 XP`);
  };

  const doneCount = EXPERIMENTS.filter((e) => progress.exps[e.id]?.done).length;
  const { rank } = rankFor(progress.xp);

  return (
    <div className="app">
      <div className="bgfx" aria-hidden="true">
        <div className="bgfx__grid" />
        <div className="bgfx__glow bgfx__glow--a" />
        <div className="bgfx__glow bgfx__glow--b" />
      </div>

      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => {
            setActiveId(null);
            setView('lab');
          }}
        >
          <span className="brand__mark">
            <Icon name="bolt" size={18} />
          </span>
          <span className="brand__text">
            <strong>LAB·CA</strong>
            <em>Coordinación de aislamiento</em>
          </span>
        </button>
        <nav className="topbar__nav">
          <button
            type="button"
            className={`topbar__view ${view === 'defiende' ? 'is-on' : ''}`}
            onClick={() => {
              setActiveId(null);
              setView(view === 'defiende' ? 'lab' : 'defiende');
              sfx.nav();
            }}
          >
            <Icon name="shield" size={14} /> Defiende
            <span className="topbar__viewnum">
              {Object.keys(progress.lab.funciones).length}/{FUNCIONES.length}
            </span>
          </button>
          <button
            type="button"
            className={`topbar__view ${view === 'sustentacion' ? 'is-on' : ''}`}
            onClick={() => {
              setActiveId(null);
              setView(view === 'sustentacion' ? 'lab' : 'sustentacion');
              sfx.nav();
            }}
          >
            <Icon name="trophy" size={14} /> Sustentación
            <span className="topbar__viewnum">{progress.lab.defense}/{ETAPAS.length}</span>
          </button>
          <span className="topbar__stat">
            <Icon name="check" size={13} /> {doneCount}/{EXPERIMENTS.length}
          </span>
          <span className="topbar__stat">
            <Icon name="trophy" size={13} /> {progress.xp} XP
          </span>
          <span className="topbar__rank">{rank.name}</span>
          <button
            type="button"
            className="btn btn--icon"
            aria-label={progress.enabledAudio ? 'Silenciar' : 'Activar sonido'}
            onClick={() => {
              const v = !progress.enabledAudio;
              setProgress((p) => ({ ...p, enabledAudio: v }));
              if (v) sfx.click();
            }}
          >
            <Icon name={progress.enabledAudio ? 'volume' : 'mute'} size={17} />
          </button>
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Descargar mi progreso"
            title="Descargar mi progreso"
            onClick={doExport}
          >
            <Icon name="download" size={17} />
          </button>
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Ayuda"
            onClick={() => setShowIntro(true)}
          >
            <Icon name="info" size={17} />
          </button>
        </nav>
      </header>

      {notice && (
        <div className="notice" role="status">
          <Icon name="info" size={15} />
          <span>{notice}</span>
          <button type="button" className="notice__x" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>
            <Icon name="x" size={13} />
          </button>
        </div>
      )}

      <main className="main">
        <ErrorBoundary resetKey={`${view}:${activeId ?? 'home'}`}>
        {active ? (
          <ExperimentView
            key={active.id}
            def={active as never}
            prevId={EXPERIMENTS[activeIdx - 1]?.id}
            nextId={EXPERIMENTS[activeIdx + 1]?.id}
            progDone={Boolean(progress.exps[active.id]?.done)}
            stars={progress.exps[active.id]?.stars ?? 0}
            attempts={progress.exps[active.id]?.attempts ?? 0}
            onComplete={complete}
            onAttempt={attempt}
            onGoto={goto}
            onBack={() => setActiveId(null)}
            defended={Boolean(progress.lab.missions[THEME_FOR(active.id) ?? ''])}
            onDefend={defend}
            draft={progress.lab.drafts[THEME_FOR(active.id) ?? '']}
            onDraft={guardarBorrador}
          />
        ) : view === 'defiende' ? (
          <DefendView progress={progress} onGoto={goto} onSolve={solveFuncion} />
        ) : view === 'sustentacion' ? (
          <Sustentacion
            defense={progress.lab.defense}
            best={progress.lab.defenseBest}
            onPass={passEtapa}
            onScore={guardarNota}
            onGoto={goto}
          />
        ) : (
          <LabHome
            progress={progress}
            onGoto={goto}
            extra={<><DefendSummary progress={progress} /><SustResumen defense={progress.lab.defense} /></>}
            onDefiende={() => setView('defiende')}
            onSustenta={() => setView('sustentacion')}
            onExport={doExport}
            onImport={doImport}
            onReset={doReset}
            onStart={() => {
              const next = EXPERIMENTS.find((e) => !progress.exps[e.id]?.done) ?? EXPERIMENTS[0];
              goto(next.id);
            }}
            onTour={() => setShowIntro(true)}
          />
        )}
        </ErrorBoundary>
      </main>

      {showIntro && (
        <IntroModal
          onClose={() => {
            setShowIntro(false);
            setProgress((p) => ({ ...p, seenIntro: true }));
          }}
        />
      )}

      {toast && (
        <div className="toast">
          <Icon name="check" size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
