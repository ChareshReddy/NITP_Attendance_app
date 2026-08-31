import React from 'react';

interface SpeedometerProps {
  score: number;
  rating: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  size?: number;
}

export default function Speedometer({ score, rating, size = 350 }: SpeedometerProps) {
  // Bounded score 0-100
  const val = Math.max(0, Math.min(100, score));
  
  // Angle: 0 score is -90deg (left), 50 is 0deg (straight up), 100 is 90deg (right)
  const needleRotation = (val - 50) * 1.8;

  // Determine active colors based on rating
  const colorMap = {
    RED: { hex: '#E4222E', label: 'Needs Improvement' },
    YELLOW: { hex: '#F59E0B', label: 'Average' },
    GREEN: { hex: '#10B981', label: 'Good' },
    BLUE: { hex: '#1E4FD8', label: 'Excellent' },
  };

  const activeColor = colorMap[rating] || colorMap.GREEN;

  return (
    <div className="flex flex-col items-center justify-center relative w-full select-none">
      <div className="relative w-full" style={{ maxWidth: size, aspectRatio: '360/140' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 360 150"
          className="overflow-visible"
        >
          <defs>
            <filter id="needle-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Segment 1: Red Arc */}
          <path
            d="M 105 120 A 75 75 0 0 1 126.97 66.97"
            fill="none"
            stroke="#E4222E"
            strokeWidth="18"
            strokeLinecap="butt"
          />

          {/* Segment 2: Yellow Arc */}
          <path
            d="M 126.97 66.97 A 75 75 0 0 1 180 45"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="18"
            strokeLinecap="butt"
          />

          {/* Segment 3: Green Arc */}
          <path
            d="M 180 45 A 75 75 0 0 1 233.03 66.97"
            fill="none"
            stroke="#10B981"
            strokeWidth="18"
            strokeLinecap="butt"
          />

          {/* Segment 4: Blue Arc */}
          <path
            d="M 233.03 66.97 A 75 75 0 0 1 255 120"
            fill="none"
            stroke="#1E4FD8"
            strokeWidth="18"
            strokeLinecap="butt"
          />

          {/* Segment Divider Lines */}
          <line x1="135.5" y1="75.5" x2="118.5" y2="58.5" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="180" y1="57" x2="180" y2="33" stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1="224.5" y1="75.5" x2="241.5" y2="58.5" stroke="#FFFFFF" strokeWidth="2.5" />

          {/* Labeled Segments (Connectors and Text) */}
          {/* Needs Improvement */}
          <path d="M 101.5 87.5 L 92.3 83.7" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          <text x="88" y="87" fill="#475569" fontSize="9" fontWeight="700" textAnchor="end">Needs Improvement</text>

          {/* Average */}
          <path d="M 147.5 41.5 L 143.7 32.3" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          <text x="139" y="29" fill="#475569" fontSize="9" fontWeight="700" textAnchor="end">Average</text>

          {/* Good */}
          <path d="M 212.5 41.5 L 216.3 32.3" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          <text x="221" y="29" fill="#475569" fontSize="9" fontWeight="700" textAnchor="start">Good</text>

          {/* Excellent */}
          <path d="M 258.5 87.5 L 267.7 83.7" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2,2" />
          <text x="272" y="87" fill="#475569" fontSize="9" fontWeight="700" textAnchor="start">Excellent</text>

          {/* Needle Pointer */}
          <g transform={`rotate(${needleRotation}, 180, 120)`} className="transition-transform duration-1000 ease-out">
            <polygon
              points="176.5,120 179.2,38 180.8,38 183.5,120"
              fill="#0D1B6E"
              filter="url(#needle-shadow)"
            />
            <circle cx="180" cy="38" r="2.5" fill={activeColor.hex} />
          </g>

          {/* Center Hub */}
          <circle cx="180" cy="120" r="10" fill="#0D1B6E" />
          <circle cx="180" cy="120" r="4" fill="#FFFFFF" />

        </svg>
      </div>
    </div>
  );
}
