'use client';

interface LogoPremiumProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
}

const sizes = {
  sm: { width: 140, height: 46, name: 14, ali: 28, slogan: 7, la: 11 },
  md: { width: 200, height: 66, name: 16, ali: 40, slogan: 9, la: 13 },
  lg: { width: 300, height: 100, name: 20, ali: 56, slogan: 12, la: 16 },
  xl: { width: 420, height: 140, name: 24, ali: 72, slogan: 14, la: 19 },
};

export default function LogoPremium({ className = '', size = 'md', showSlogan = true }: LogoPremiumProps) {
  const s = sizes[size];
  const cx = s.width / 2;

  return (
    <svg
      viewBox={`0 0 ${s.width} ${showSlogan ? s.height : s.height * 0.8}`}
      fill="none"
      className={`${className}`}
      style={{ fontFamily: 'var(--font-poppins), Poppins, Montserrat, system-ui, sans-serif' }}
    >
      {/* Mint accent line top */}
      <rect x={cx - s.width * 0.18} y={s.height * 0.1} width={s.width * 0.36} height={1.5} rx="0.75" fill="#A7D8CC" opacity="0.6"/>

      {/* "LA QUINTA DE" */}
      <text
        x={cx}
        y={s.height * 0.32}
        textAnchor="middle"
        fontSize={s.la}
        fontWeight="400"
        letterSpacing="3"
        fill="#6B7B7A"
      >
        LA QUINTA DE
      </text>

      {/* "Alí" */}
      <text
        x={cx}
        y={s.height * 0.66}
        textAnchor="middle"
        fontSize={s.ali}
        fontWeight="700"
        letterSpacing="2"
        fill="#2D6A5E"
      >
        Alí
      </text>

      {/* Bottom accent line */}
      <rect x={cx - s.width * 0.18} y={s.height * 0.72} width={s.width * 0.36} height={1.5} rx="0.75" fill="#A7D8CC" opacity="0.6"/>

      {/* Slogan */}
      {showSlogan && (
        <text
          x={cx}
          y={s.height * 0.9}
          textAnchor="middle"
          fontSize={s.slogan}
          fontWeight="300"
          letterSpacing="2"
          fill="#9AABA8"
        >
          MOMENTOS PREMIUM EN SANTIAGO
        </text>
      )}
    </svg>
  );
}
