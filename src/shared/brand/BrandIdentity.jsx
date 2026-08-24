const BRAND_LOGO_SRC = '/brand/noc-report-logo.png';

const MARK_SIZE = {
  xs: 'h-8 w-8 rounded-xl',
  sm: 'h-10 w-10 rounded-2xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-16 w-16 rounded-[20px]',
  xl: 'h-24 w-24 rounded-[28px]',
};

export function BrandMark({
  size = 'md',
  className = '',
  inverse = false,
  eager = false,
}) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border p-1 shadow-[var(--shadow-sm)] ${MARK_SIZE[size] ?? MARK_SIZE.md} ${
        inverse
          ? 'border-white/12 bg-white/[0.07] shadow-[0_16px_38px_rgb(0_0_0/24%)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]'
      } ${className}`}
      aria-hidden="true"
    >
      <span
        className={`pointer-events-none absolute inset-0 ${
          inverse
            ? 'bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/14%),transparent_48%)]'
            : 'bg-[radial-gradient(circle_at_30%_20%,var(--accent-glow),transparent_62%)]'
        }`}
      />
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        draggable="false"
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        className="relative z-10 h-full w-full select-none object-contain"
      />
    </span>
  );
}

export function BrandLockup({
  inverse = false,
  compact = false,
  markSize = 'md',
  eager = false,
  className = '',
  subtitle = 'Operations Workspace',
}) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`} aria-label="NOC Report">
      <BrandMark size={markSize} inverse={inverse} eager={eager} />
      <div className="min-w-0">
        <p
          className={`truncate font-[var(--font-display)] font-bold tracking-[-0.035em] ${
            compact ? 'text-sm' : 'text-[15px]'
          } ${inverse ? 'text-white' : 'text-[var(--text-primary)]'}`}
        >
          NOC Report
        </p>
        <p
          className={`mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] ${
            inverse ? 'text-white/45' : 'text-[var(--text-muted)]'
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export { BRAND_LOGO_SRC };
