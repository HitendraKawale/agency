/**
 * A single Lighthouse-style score, drawn in the house language: hairline
 * track, mint arc, tabular numeral. Pure SVG — no client JS, no dependency
 * on the shape of Google's own widget.
 */

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ScoreRing({
  value,
  display,
  label,
}: {
  /** 0–100, drives the arc length. */
  value: number;
  /** Overrides the numeral when it isn't a percentage (e.g. "3/3"). */
  display?: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const offset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <li className="score">
      <svg
        className="score-ring"
        viewBox="0 0 132 132"
        role="img"
        aria-label={`${label}: ${display ?? value}`}
      >
        <circle className="score-track" cx="66" cy="66" r={RADIUS} />
        <circle
          className="score-arc"
          cx="66"
          cy="66"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
        <text
          className="score-value"
          x="66"
          y="66"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {display ?? value}
        </text>
      </svg>
      <p className="score-label">{label}</p>
    </li>
  );
}
