interface StellanorLogoProps {
  size?: number;
  className?: string;
}

// The Stellanor mark: a stylised "S" formed from two arcing data-flow paths,
// suggesting intelligence in motion. Clean, modern, data-company aesthetic.
export function StellanorMark({ size = 32, className = "" }: StellanorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stellanor"
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="7" fill="#1a56db" />
      {/* Top arc — upper sweep of the S */}
      <path
        d="M9 11.5C9 9.57 10.57 8 12.5 8H19.5C21.43 8 23 9.57 23 11.5C23 13.43 21.43 15 19.5 15H12.5C10.57 15 9 16.57 9 18.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom arc — lower sweep of the S */}
      <path
        d="M23 20.5C23 22.43 21.43 24 19.5 24H12.5C10.57 24 9 22.43 9 20.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Central data node */}
      <circle cx="16" cy="16" r="2" fill="white" />
    </svg>
  );
}

// Full wordmark: mark + "Stellanor" text
export function StellanorWordmark({ size = 32, className = "" }: StellanorLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <StellanorMark size={size} />
      <span
        style={{
          fontSize: size * 0.44,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        Stellanor
      </span>
    </span>
  );
}
