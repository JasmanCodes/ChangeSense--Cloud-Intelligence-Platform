import React from 'react';

export interface GaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLevel?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({
  score,
  size = 140,
  strokeWidth = 12,
  label = 'Risk Score',
  showLevel = true,
}) => {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Semi-circle or 240-degree arc
  const arcLength = 0.75 * circumference;
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  let color = '#10B981'; // green / LOW
  let levelText = 'LOW';
  if (normalizedScore > 60) {
    color = '#EF4444'; // red / HIGH
    levelText = 'HIGH';
  } else if (normalizedScore > 30) {
    color = '#F59E0B'; // amber / MEDIUM
    levelText = 'MEDIUM';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1F293D"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Score colored arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center reading */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-white">
            {Math.round(normalizedScore)}
          </span>
          {showLevel && (
            <span
              className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full mt-0.5"
              style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
              }}
            >
              {levelText}
            </span>
          )}
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 font-medium -mt-2">{label}</span>}
    </div>
  );
};
