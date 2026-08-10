import React from 'react';

interface SpeedometerProps {
  score: number;
  rating: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  size?: number;
}

export default function Speedometer({ score, rating, size = 180 }: SpeedometerProps) {
  // Bounded score 0-100
  const val = Math.max(0, Math.min(100, score));
  
  // Angle: 0 score is -180deg (left), 100 score is 0deg (right)
  const needleRotation = (val * 1.8) - 180;

  // Determine active colors based on rating
  const colorMap = {
    RED: { text: 'text-brand-red', bg: 'bg-red-50 border-red-100', hex: '#EF4444' },
    YELLOW: { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', hex: '#F59E0B' },
    GREEN: { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hex: '#10B981' },
    BLUE: { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', hex: '#3B82F6' },
  };

  const activeColor = colorMap[rating] || colorMap.GREEN;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden h-full">
      {/* Speedometer Gauge Arc */}
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
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

          {/* Background track (light gray) */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="url(#speedometer-grad)"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Ticks & Labels */}
          {/* 0% Tick */}
          <line x1="20" y1="110" x2="30" y2="110" stroke="#9CA3AF" strokeWidth="2" />
          <text x="12" y="125" fill="#9CA3AF" fontSize="9" fontWeight="bold" textAnchor="middle">0</text>

          {/* 50% Tick */}
          <line x1="100" y1="30" x2="100" y2="40" stroke="#9CA3AF" strokeWidth="2" />
          <text x="100" y="24" fill="#9CA3AF" fontSize="9" fontWeight="bold" textAnchor="middle">50</text>

          {/* 100% Tick */}
          <line x1="180" y1="110" x2="170" y2="110" stroke="#9CA3AF" strokeWidth="2" />
          <text x="188" y="125" fill="#9CA3AF" fontSize="9" fontWeight="bold" textAnchor="middle">100</text>

          {/* Active value arc representation (dashed indicator) */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeDasharray="2, 6"
            opacity="0.3"
          />

          {/* Needle Pointer */}
          <g transform={`rotate(${needleRotation}, 100, 110)`} className="transition-transform duration-1000 ease-out">
            {/* Sleek triangle needle */}
            <polygon
              points="96,110 100,20 104,110"
              fill="#1F2937"
              filter="url(#shadow)"
            />
            {/* Colored tip */}
            <circle cx="100" cy="22" r="3" fill={activeColor.hex} />
          </g>

          {/* Center Hub */}
          <circle cx="100" cy="110" r="10" fill="#1F2937" />
          <circle cx="100" cy="110" r="4" fill="#FFFFFF" />
        </svg>

        {/* Text values absolutely centered at the bottom of the semi-circle */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
          <span className="text-3xl font-black text-brand-navy leading-none tracking-tight">
            {Math.round(val)}%
          </span>
          <span className={`mt-2 px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border ${activeColor.bg} ${activeColor.text} tracking-wider uppercase`}>
            {rating}
          </span>
        </div>
      </div>
    </div>
  );
}
