interface LogoProps {
  variant: 'full-blue' | 'full-white' | 'icon-blue' | 'icon-white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeConfig = {
  sm: { icon: 20, text: 14, spacing: 6 },
  md: { icon: 32, text: 20, spacing: 8 },
  lg: { icon: 48, text: 28, spacing: 12 },
  xl: { icon: 64, text: 36, spacing: 16 },
};

// Icon component: Rising bar chart with growth trend line symbolizing educational progress
function LearnMetricsIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Subtle elevation shadow for trend line */}
      <defs>
        <filter id="trendShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
          <feOffset dx="0" dy="0.5" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rising bars representing metrics/data */}
      <rect x="4" y="20" width="5" height="8" fill={color} rx="1" />
      <rect x="11" y="14" width="5" height="14" fill={color} rx="1" />
      <rect x="18" y="8" width="5" height="20" fill={color} rx="1" />

      {/* Smooth upward trend curve */}
      <path
        d="M 3 16 Q 10 10, 15 7 T 26 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#trendShadow)"
      />

      {/* Right-facing arrow at end of trend line */}
      <path
        d="M 26 4 L 24 2.5 M 26 4 L 24 5.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#trendShadow)"
      />
    </svg>
  );
}

export function LearnMetricsLogo({ variant, size = 'md' }: LogoProps) {
  const config = sizeConfig[size];
  const isWhite = variant.includes('white');
  const isIconOnly = variant.includes('icon');
  const color = isWhite ? '#FFFFFF' : 'hsl(214, 84%, 45%)';

  return (
    <div className="inline-flex items-center" style={{ gap: `${config.spacing}px` }}>
      <LearnMetricsIcon color={color} size={config.icon} />

      {!isIconOnly && (
        <span
          style={{
            color,
            fontSize: `${config.text}px`,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          LearnMetrics
        </span>
      )}
    </div>
  );
}
