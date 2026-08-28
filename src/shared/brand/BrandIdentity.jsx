const BRAND_LOGO_SRC = '/brand/noc-report-logo.png';

const MARK_SIZE = {
  xs: 'h-8 w-8 rounded-[9px]',
  sm: 'h-9 w-9 rounded-[10px]',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-14 w-14 rounded-[15px]',
  xl: 'h-20 w-20 rounded-[20px]',
};

export function BrandMark({ size = 'md', className = '', inverse = false, eager = false }) {
  return (
    <span
      className={`brand-mark relative grid shrink-0 place-items-center overflow-hidden border ${MARK_SIZE[size] ?? MARK_SIZE.md} ${
        inverse ? 'brand-mark--inverse' : ''
      } ${className}`}
      aria-hidden="true"
    >
      <span className="brand-mark__glyph" aria-hidden="true">N</span>
      <span className="brand-mark__signal" aria-hidden="true" />
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        draggable="false"
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        className="pointer-events-none absolute h-px w-px select-none opacity-0"
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
    <div className={`brand-lockup flex min-w-0 items-center gap-2.5 ${className}`} aria-label="NOC Report">
      <BrandMark size={markSize} inverse={inverse} eager={eager} />
      <div className="min-w-0">
        <p
          className={`brand-lockup__title truncate font-[var(--font-display)] font-semibold tracking-[-0.025em] ${
            compact ? 'text-sm' : 'text-[14px]'
          } ${inverse ? 'text-white' : 'text-[var(--text-primary)]'}`}
        >
          NOC Report
        </p>
        <p
          className={`brand-lockup__subtitle mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.12em] ${
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
