import React from 'react';

interface SpeedometerProps {
  score: number;
  rating: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  size?: number;
}

export default function Speedometer({ score, rating, size = 180 }: SpeedometerProps) {
  // Bounded score 0-100
  const val = Math.max(0, Math.min(100, score));
  
  // Angle: 0 score is -90deg (left), 50 is 0deg (straight up), 100 is 90deg (right)
  const needleRotation = (val - 50) * 1.8;

  // Determine active colors based on rating
  const colorMap = {
    RED: { text: 'text-brand-red', bg: 'bg-red-50 border-red-100', hex: '#EF4444' },
    YELLOW: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', hex: '#F59E0B' },
    GREEN: { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hex: '#10B981' },
    BLUE: { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', hex: '#3B82F6' },
  };

  const activeColor = colorMap[rating] || colorMap.GREEN;

  return (
    <div className="flex flex-col items-center justify-center relative w-full">
      {/* Speedometer Gauge Arc */}
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          width={size}
          height={size * 0.6}
          viewBox="0 0 200 120"
          className="overflow-visible"
        >
          <defs>
            {/* Speedometer color gradient arc */}
            <linearGradient id="speedometer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />     {/* RED */}
              <stop offset="35%" stopColor="#EF4444" />
              <stop offset="45%" stopColor="#F59E0B" />    {/* YELLOW */}
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#10B981" />    {/* GREEN */}
              <stop offset="82%" stopColor="#10B981" />
              <stop offset="90%" stopColor="#3B82F6" />    {/* BLUE */}
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background track (light gray) - radius 82, center (100, 110) */}
          <path
            d="M 18 110 A 82 82 0 0 1 182 110"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 18 110 A 82 82 0 0 1 182 110"
            fill="none"
            stroke="url(#speedometer-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Dash Overlay for clean segmentation */}
          <path
            d="M 18 110 A 82 82 0 0 1 182 110"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeDasharray="2, 6"
            opacity="0.25"
          />

          {/* Ticks and Labels (positioned cleanly outside the arc) */}
          {/* 0 label */}
          <line x1="10" y1="110" x2="18" y2="110" stroke="#D1D5DB" strokeWidth="1.5" />
          <text x="2" y="114" fill="#9CA3AF" fontSize="10" fontWeight="800" textAnchor="middle">0</text>

          {/* 25 label */}
          <line x1="36.4" y1="46.4" x2="42" y2="52" stroke="#D1D5DB" strokeWidth="1.5" />
          <text x="26" y="44" fill="#9CA3AF" fontSize="10" fontWeight="800" textAnchor="middle">25</text>

          {/* 50 label */}
          <line x1="100" y1="28" x2="100" y2="36" stroke="#D1D5DB" strokeWidth="1.5" />
          <text x="100" y="18" fill="#9CA3AF" fontSize="10" fontWeight="800" textAnchor="middle">50</text>

          {/* 75 label */}
          <line x1="163.6" y1="46.4" x2="158" y2="52" stroke="#D1D5DB" strokeWidth="1.5" />
          <text x="174" y="44" fill="#9CA3AF" fontSize="10" fontWeight="800" textAnchor="middle">75</text>

          {/* 100 label */}
          <line x1="190" y1="110" x2="182" y2="110" stroke="#D1D5DB" strokeWidth="1.5" />
          <text x="198" y="114" fill="#9CA3AF" fontSize="10" fontWeight="800" textAnchor="middle">100</text>

          {/* Needle Pointer */}
          <g transform={`rotate(${needleRotation}, 100, 110)`} className="transition-transform duration-1000 ease-out">
            <polygon
              points="97,110 100,32 103,110"
              fill="#1F2937"
              filter="url(#shadow)"
            />
            {/* Pointer colored tip */}
            <circle cx="100" cy="34" r="2.5" fill={activeColor.hex} />
          </g>

          {/* Center Hub */}
          <circle cx="100" cy="110" r="8" fill="#1F2937" />
          <circle cx="100" cy="110" r="3.5" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );
}
