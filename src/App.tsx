import { useEffect, useMemo, useState } from 'react';
import { EXPERIMENTS } from './experiments';
import { ExperimentView } from './components/ExperimentView';
import { LabHome } from './components/LabHome';
import { IntroModal } from './components/IntroModal';
import { Icon } from './components/ui';
import { loadProgress, rankFor, saveProgress, type Progress } from './lib/storage';
import { sfx } from './lib/audio';

const XP_BY_STARS = [0, 120, 170, 220];

export function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(() => !loadProgress().seenIntro);
  const [toast, setToast] = useState<string | null>(null);

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
        <button type="button" className="brand" onClick={() => setActiveId(null)}>
          <span className="brand__mark">
            <Icon name="bolt" size={18} />
          </span>
          <span className="brand__text">
            <strong>LAB·CA</strong>
            <em>Coordinación de aislamiento</em>
          </span>
        </button>
        <nav className="topbar__nav">
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
            aria-label="Ayuda"
            onClick={() => setShowIntro(true)}
          >
            <Icon name="info" size={17} />
          </button>
        </nav>
      </header>

      <main className="main">
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
          />
        ) : (
          <LabHome
            progress={progress}
            onGoto={goto}
            onStart={() => {
              const next = EXPERIMENTS.find((e) => !progress.exps[e.id]?.done) ?? EXPERIMENTS[0];
              goto(next.id);
            }}
            onTour={() => setShowIntro(true)}
          />
        )}
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
