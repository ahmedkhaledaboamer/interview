/** Soft purple glow in the top corner, layered over the grid set on <body>. */
export default function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-56 -end-40 size-[42rem] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--glow) 0%, transparent 65%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }}
      />
    </div>
  );
}
