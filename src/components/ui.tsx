import { useEffect, useRef, useState } from 'react';
import { fmt, niceTicks } from '../lib/num';
import type { Readout, Tone } from '../experiments/types';

/* ---------------------------------- Iconos --------------------------------- */

const paths: Record<string, string> = {
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  wave: 'M2 12c2 0 2-6 4-6s2 12 4 12 2-9 4-9 2 3 4 3',
  gauge: 'M12 21a9 9 0 1 1 9-9M12 12l5-5',
  tower: 'M8 21 12 3l4 18M6 13h12M7.5 8h9M5 21h14',
  chain: 'M7 7a4 4 0 0 0 0 8h2M17 17a4 4 0 0 0 0-8h-2M8 12h8',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z',
  ground: 'M12 3v9M4 12h16M7 16h10M9.5 20h5',
  arrows: 'M4 8h12l-3-3M20 16H8l3 3',
  chip: 'M7 7h10v10H7zM4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3',
  spark: 'M12 3v5M12 16v5M4.2 7.5l4.3 2.5M15.5 14l4.3 2.5M4.2 16.5l4.3-2.5M15.5 10l4.3-2.5',
  check: 'M4 12.5 9 17.5 20 6.5',
  x: 'M6 6l12 12M18 6 6 18',
  play: 'M7 4l13 8-13 8V4Z',
  pause: 'M8 4v16M16 4v16',
  reset: 'M4 4v6h6M4.5 10a8 8 0 1 1 1.6 7',
  info: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  arrowRight: 'M4 12h15M13 6l6 6-6 6',
  arrowLeft: 'M20 12H5M11 6l-6 6 6 6',
  volume: 'M4 9h3l4-4v14l-4-4H4V9ZM15 8a5 5 0 0 1 0 8 7 7 0 0 1 0-8Z',
  mute: 'M4 9h3l4-4v14l-4-4H4V9ZM15 9l5 6M20 9l-5 6',
  trophy: 'M7 4h10v4a5 5 0 0 1-10 0V4ZM5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4M12 13v4M8 21h8l-1-3H9l-1 3Z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  lock: 'M6 11h12v10H6zM9 11V7a3 3 0 0 1 6 0v4',
  flame: 'M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 1 3s2-3 2-8Z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
};

export function Icon({
  name,
  size = 18,
  className = '',
}: {
  name: keyof typeof paths | string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.info} />
    </svg>
  );
}

/* --------------------------------- Toggle ---------------------------------- */

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'is-on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="toggle__dot" />
      <span>{label}</span>
    </button>
  );
}

/* ---------------------------------- Slider -------------------------------- */

interface SliderProps {
  id: string;
  label: string;
  symbol?: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  decimals?: number;
  hint?: string;
  onChange: (v: number) => void;
  accent?: string;
}

export function Slider({
  id,
  label,
  symbol,
  unit,
  min,
  max,
  step,
  value,
  decimals,
  hint,
  onChange,
  accent,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const dec = decimals ?? (step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 2);
  const idSafe = `sl-${id}-${label.replace(/\W+/g, '')}`;
  return (
    <div className="slider" style={accent ? ({ ['--accent' as never]: accent } as never) : undefined}>
      <div className="slider__head">
        <label htmlFor={idSafe}>
          {symbol && <span className="slider__sym">{symbol}</span>}
          {label}
        </label>
        <div className="slider__value">
          <span>{fmt(value, dec)}</span>
          <em>{unit}</em>
        </div>
      </div>
      <input
        id={idSafe}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as never]: `${pct}%` }}
        aria-valuetext={`${fmt(value, dec)} ${unit}`}
      />
      {hint && <p className="slider__hint">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Readouts -------------------------------- */

const toneIcon: Record<Tone, string> = {
  ok: 'check',
  warn: 'info',
  bad: 'x',
  info: 'info',
  neutral: 'info',
};

export function ReadoutGrid({ items }: { items: Readout[] }) {
  return (
    <div className="readouts">
      {items.map((r, i) => (
        <div key={i} className={`readout tone-${r.tone ?? 'neutral'}`}>
          <div className="readout__label">
            {r.tone && <Icon name={toneIcon[r.tone]} size={13} />}
            <span>{r.label}</span>
            {r.symbol && <code>{r.symbol}</code>}
          </div>
          <div className="readout__value">
            <strong>{r.value}</strong>
            {r.unit && <em>{r.unit}</em>}
          </div>
          {r.note && <p className="readout__note">{r.note}</p>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Ecuación viva ------------------------------ */

export function LiveMath({ lines }: { lines: string[] }) {
  return (
    <div className="livemath">
      {lines.map((l, i) => (
        <div key={i} className={`livemath__line ${i === lines.length - 1 ? 'is-last' : ''}`}>
          {l}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- SVG Plot -------------------------------- */

export interface Series {
  points: [number, number][];
  color: string;
  width?: number;
  dash?: string;
  fill?: boolean;
  label?: string;
}

export interface VMarker {
  x?: number;
  y?: number;
  color: string;
  label?: string;
  dash?: string;
}

export interface Band {
  x?: [number, number];
  y?: [number, number];
  color: string;
  label?: string;
}

interface PlotProps {
  series: Series[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  markers?: VMarker[];
  bands?: Band[];
  height?: number;
  legend?: boolean;
  xFmt?: (v: number) => string;
  yFmt?: (v: number) => string;
  logY?: boolean;
  onClickX?: (x: number) => void;
  className?: string;
}

export function SvgPlot({
  series,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  markers = [],
  bands = [],
  height = 230,
  legend = true,
  xFmt,
  yFmt,
  logY = false,
  onClickX,
  className = '',
}: PlotProps) {
  const W = 620;
  const H = height;
  const m = { t: 16, r: 16, b: 34, l: 48 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const [x0, x1] = xDomain;

  const yLo = logY ? Math.log10(Math.max(1e-12, yDomain[0])) : yDomain[0];
  const yHi = logY ? Math.log10(Math.max(1e-11, yDomain[1])) : yDomain[1];
  const sx = (x: number) => m.l + ((x - x0) / (x1 - x0 || 1)) * iw;
  const syRaw = (y: number) => {
    const v = logY ? Math.log10(Math.max(1e-12, y)) : y;
    return m.t + ih - ((v - yLo) / (yHi - yLo || 1)) * ih;
  };
  const sy = (y: number) => Math.min(m.t + ih + 1, Math.max(m.t - 1, syRaw(y)));

  const xticks = niceTicks(x0, x1, 5);
  const yticks = logY
    ? Array.from(
        { length: Math.max(1, Math.round(yHi - yLo) + 1) },
        (_, i) => Math.pow(10, yLo + i),
      )
    : niceTicks(yDomain[0], yDomain[1], 4);

  const pathFor = (pts: [number, number][]) => {
    if (!pts.length) return '';
    return pts
      .map(([x, y], i) => {
        const X = sx(x);
        const Y = sy(y);
        if (!Number.isFinite(X) || !Number.isFinite(Y)) return '';
        return `${i === 0 ? 'M' : 'L'}${X.toFixed(1)},${Y.toFixed(1)}`;
      })
      .join(' ');
  };

  const areaFor = (pts: [number, number][]) => {
    if (!pts.length) return '';
    const base = m.t + ih;
    return `${pathFor(pts)} L${sx(pts[pts.length - 1][0]).toFixed(1)},${base} L${sx(pts[0][0]).toFixed(1)},${base} Z`;
  };

  return (
    <div className={`plot ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="gráfica interactiva">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`g${i}-${s.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.34" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {bands.map((b, i) =>
          b.y ? (
            <rect
              key={i}
              x={m.l}
              y={sy(b.y[1])}
              width={iw}
              height={Math.max(0, sy(b.y[0]) - sy(b.y[1]))}
              fill={b.color}
              opacity={0.1}
            />
          ) : b.x ? (
            <rect
              key={i}
              x={sx(b.x[0])}
              y={m.t}
              width={Math.max(0, sx(b.x[1]) - sx(b.x[0]))}
              height={ih}
              fill={b.color}
              opacity={0.1}
            />
          ) : null,
        )}

        {yticks.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={m.l} x2={m.l + iw} y1={sy(v)} y2={sy(v)} stroke="rgba(148,180,220,0.12)" strokeWidth="1" />
            <text x={m.l - 8} y={sy(v) + 4} textAnchor="end" className="plot__tick">
              {yFmt ? yFmt(v) : logY ? (v >= 1 ? fmt(v, 0) : fmt(v, 3)) : fmt(v, Math.abs(v) < 10 ? 2 : 0)}
            </text>
          </g>
        ))}
        {xticks.map((v, i) => (
          <g key={`x${i}`}>
            <line x1={sx(v)} x2={sx(v)} y1={m.t} y2={m.t + ih} stroke="rgba(148,180,220,0.07)" strokeWidth="1" />
            <text x={sx(v)} y={m.t + ih + 18} textAnchor="middle" className="plot__tick">
              {xFmt ? xFmt(v) : fmt(v, Math.abs(v) < 10 ? 1 : 0)}
            </text>
          </g>
        ))}

        {markers.map(
          (mk, i) =>
            mk.y !== undefined && (
              <line
                key={`my${i}`}
                x1={m.l}
                x2={m.l + iw}
                y1={sy(mk.y)}
                y2={sy(mk.y)}
                stroke={mk.color}
                strokeWidth="1.4"
                strokeDasharray={mk.dash ?? '5 4'}
                opacity={0.9}
              />
            ),
        )}
        {markers.map(
          (mk, i) =>
            mk.x !== undefined && (
              <line
                key={`mx${i}`}
                x1={sx(mk.x)}
                x2={sx(mk.x)}
                y1={m.t}
                y2={m.t + ih}
                stroke={mk.color}
                strokeWidth="1.4"
                strokeDasharray={mk.dash ?? '5 4'}
                opacity={0.9}
              />
            ),
        )}

        {series.map((s, i) =>
          s.fill ? (
            <path key={`a${i}`} d={areaFor(s.points)} fill={`url(#g${i}-${s.color.replace('#', '')})`} />
          ) : null,
        )}
        {series.map((s, i) => (
          <path
            key={`s${i}`}
            d={pathFor(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width ?? 2}
            strokeDasharray={s.dash}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} stroke="rgba(160,200,240,0.35)" />
        <line x1={m.l} x2={m.l} y1={m.t} y2={m.t + ih} stroke="rgba(160,200,240,0.35)" />

        {xLabel && (
          <text x={m.l + iw / 2} y={H - 4} textAnchor="middle" className="plot__axis">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            x={12}
            y={m.t + ih / 2}
            textAnchor="middle"
            className="plot__axis"
            transform={`rotate(-90 12 ${m.t + ih / 2})`}
          >
            {yLabel}
          </text>
        )}

        {markers.map(
          (mk, i) =>
            mk.label && (
              <text
                key={`ml${i}`}
                x={mk.x !== undefined ? Math.min(m.l + iw - 4, Math.max(m.l + 4, sx(mk.x) + 6)) : m.l + iw - 4}
                y={mk.y !== undefined ? Math.max(m.t + 12, sy(mk.y) - 5) : m.t + 14 + i * 14}
                textAnchor={mk.x !== undefined ? 'start' : 'end'}
                className="plot__note"
                fill={mk.color}
              >
                {mk.label}
              </text>
            ),
        )}

        {onClickX && (
          <rect
            x={m.l}
            y={m.t}
            width={iw}
            height={ih}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onClick={(e) => {
              const rect = (e.target as SVGRectElement).ownerSVGElement!.getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * W;
              const x = x0 + ((px - m.l) / iw) * (x1 - x0);
              onClickX(Math.min(x1, Math.max(x0, x)));
            }}
          />
        )}
      </svg>
      {legend && (
        <div className="plot__legend">
          {series
            .filter((s) => s.label)
            .map((s, i) => (
              <span key={i}>
                <i style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          {markers
            .filter((mk) => mk.label === undefined)
            .map(() => null)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Panel & Card ------------------------------ */

export function Panel({
  title,
  icon,
  right,
  children,
  className = '',
}: {
  title: string;
  icon?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__head">
        <h3>
          {icon && <Icon name={icon} size={15} />}
          {title}
        </h3>
        {right}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Collapse({
  title,
  children,
  defaultOpen = false,
  icon = 'info',
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.style.maxHeight = open ? `${bodyRef.current.scrollHeight + 40}px` : '0px';
  }, [open, children]);
  return (
    <div className={`collapse ${open ? 'is-open' : ''}`}>
      <button type="button" className="collapse__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name={icon} size={15} />
        <span>{title}</span>
        <Icon name="arrowRight" size={15} className="collapse__chev" />
      </button>
      <div className="collapse__wrap" ref={bodyRef}>
        <div className="collapse__body">{children}</div>
      </div>
    </div>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

export function Stars({ n, total = 3 }: { n: number; total?: number }) {
  return (
    <span className="stars" aria-label={`${n} de ${total} estrellas`}>
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={i < n ? 'on' : 'off'} width={14} height={14}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z" />
        </svg>
      ))}
    </span>
  );
}
