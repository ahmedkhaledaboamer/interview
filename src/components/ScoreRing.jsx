export default function ScoreRing({ value, tone = 'accent', size = 148, label }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const color = { accent: 'var(--accent)', ok: 'var(--ok)', bad: 'var(--bad)' }[tone];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--card-2)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl font-bold tracking-tight" dir="ltr">
            {Math.round(v)}%
          </div>
          {label && <div className="text-xs text-muted">{label}</div>}
        </div>
      </div>
    </div>
  );
}
