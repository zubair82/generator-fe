import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function ExamSimulaLogo({ size = 34, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible select-none drop-shadow-sm transition-transform duration-200 hover:scale-[1.02] shrink-0 ${className}`}
    >
      <g className="transition-all duration-300 ease-out">
        <defs>
          <linearGradient id="scalable-paper-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="scalable-bar3-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path
          d="
            M 60 32
            L 150 32
            L 188 70
            L 188 200
            Q 188 208 180 208
            L 60 208
            Q 52 208 52 200
            L 52 40
            Q 52 32 60 32
            Z
          "
          fill="url(#scalable-paper-grad)"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-out"
        />
        <path
          d="
            M 150 32
            L 150 68
            Q 150 70 152 70
            L 188 70
            Z
          "
          fill="#2563eb"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinejoin="round"
          fillOpacity="0.2"
        />
        <line x1="150" y1="32" x2="188" y2="70" stroke="#0f172a" strokeWidth="3" strokeOpacity="0.5" />
        <rect x="74" y="148" width="20" height="38" rx="4" fill="#93c5fd" className="transition-all duration-300 ease-out" />
        <rect x="105" y="118" width="20" height="68" rx="4" fill="#3b82f6" className="transition-all duration-300 ease-out" />
        <rect x="136" y="84" width="20" height="102" rx="4" fill="url(#scalable-bar3-grad)" />
        <g className="transition-all duration-300 ease-out">
          <path
            d="M 84 152 L 115 122 L 146 80 L 166 58"
            fill="none"
            stroke="#2563eb"
            strokeWidth="5.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 ease-out"
          />
          <polygon points="171,52 159,57 166,66" fill="#2563eb" />
        </g>
      </g>
    </svg>
  );
}

export { ExamSimulaLogo };
