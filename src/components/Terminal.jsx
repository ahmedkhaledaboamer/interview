import { useTypewriter } from '../hooks/useTypewriter.js';

export default function Terminal({ commands }) {
  const typed = useTypewriter(commands);
  return (
    <div
      dir="ltr"
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card/80 px-5 py-2.5 font-mono text-sm shadow-sm backdrop-blur"
    >
      <span className="text-accent-text">~/ahmed</span>
      <span className="text-muted">$</span>
      <span className="truncate text-fg" aria-hidden="true">
        {typed}
      </span>
      <span className="sr-only">{commands[0]}</span>
      <span aria-hidden="true" className="h-4 w-2 shrink-0 animate-blink bg-accent" />
    </div>
  );
}
