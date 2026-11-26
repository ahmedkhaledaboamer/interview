export default function ProgressBar({ value, label, className = '' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-card-2 ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
