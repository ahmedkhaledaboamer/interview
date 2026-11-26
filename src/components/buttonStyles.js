const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:opacity-45 disabled:pointer-events-none select-none';

const variants = {
  primary:
    'bg-accent text-accent-fg hover:brightness-105 hover:shadow-[0_8px_30px_-8px_rgba(252,194,36,.55)] motion-safe:hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'border border-line bg-card/60 text-fg hover:border-line-strong hover:bg-card-2 motion-safe:hover:-translate-y-0.5',
  subtle: 'text-muted hover:text-fg hover:bg-card-2',
  danger: 'bg-bad text-white hover:brightness-110',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function btn(variant = 'primary', size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}
