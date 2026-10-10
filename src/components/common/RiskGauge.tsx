import React from 'react';
import { RiskCategory } from '../../types';

interface RiskGaugeProps {
  score: number;
  category: RiskCategory;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, category, size = 180 }) => {
  // Semi-circle arc geometry
  const radius = size * 0.38;
  const strokeWidth = 14;
  const center = size / 2;

  // Arc angle from -180 to 0 degrees
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = (clampedScore / 100) * 180; // 0 to 180 deg

  const categoryColor = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#F97316',
    severe: '#EF4444',
  }[category];

  // Calculate needle coordinate
  const radian = ((180 - angle) * Math.PI) / 180;
  const needleLength = radius - 8;
  const needleX = center + needleLength * Math.cos(radian);
  const needleY = center - needleLength * Math.sin(radian);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        className="overflow-visible"
      >
        {/* Background Track Arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          className="stroke-fin-border"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* 4 Discrete Risk Zone Color Ticks */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${
            center - radius * Math.cos((45 * Math.PI) / 180)
          } ${center - radius * Math.sin((45 * Math.PI) / 180)}`}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeDasharray="4 2"
          opacity={0.4}
        />
        <path
          d={`M ${center + radius * Math.cos((45 * Math.PI) / 180)} ${
            center - radius * Math.sin((45 * Math.PI) / 180)
          } A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="#EF4444"
          strokeWidth={strokeWidth}
          strokeDasharray="4 2"
          opacity={0.4}
        />

        {/* Dynamic Filled Active Arc */}
        {clampedScore > 0 && (
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${
              center - radius * Math.cos((angle * Math.PI) / 180)
            } ${center - radius * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke={categoryColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Center Needle & Pivot */}
        <line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          className="stroke-fin-text transition-all duration-700 ease-out"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={center} cy={center} r="6" className="fill-fin-text" />
        <circle cx={center} cy={center} r="3" className="fill-fin-bg" />
      </svg>

      <div className="-mt-3 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-mono text-3xl font-extrabold tracking-tight text-fin-text tabular-nums">
            {score}
          </span>
          <span className="font-mono text-sm text-fin-muted">/100</span>
        </div>
        <div
          className="text-xs font-semibold tracking-wider uppercase mt-0.5"
          style={{ color: categoryColor }}
        >
          {category} Risk
        </div>
      </div>
    </div>
  );
};
