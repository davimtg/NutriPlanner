import React from 'react';
import { NutrientInfo } from '../types';

interface NutrientDonutChartProps {
  nutrientKey: keyof NutrientInfo;
  label: string;
  consumed: number;
  target: number;
  unit: string;
  colorClass?: string; // Tailwind class for stroke and text color e.g. "stroke-blue-500 text-blue-500"
  size?: number; // Diameter of the donut
  strokeWidth?: number;
}

const NutrientDonutChart: React.FC<NutrientDonutChartProps> = ({
  label,
  consumed,
  target,
  unit,
  colorClass = 'stroke-emerald-500 text-emerald-500',
  size = 80, // Adjusted size for better fit on dashboard
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const safeConsumed = Math.max(0, consumed);
  const safeTarget = Math.max(1, target); // Avoid division by zero, ensure target is at least 1
  
  let percentage = (safeConsumed / safeTarget) * 100;
  if (percentage > 100 && safeTarget > 0) percentage = 100; // Cap at 100% for visual
  if (safeTarget <= 0) percentage = 0; // If target is 0 or less, show 0%

  const offset = circumference - (percentage / 100) * circumference;

  const viewBox = `0 0 ${size} ${size}`;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <svg width={size} height={size} viewBox={viewBox} role="img" aria-label={`${label}: ${safeConsumed.toFixed(unit === 'mg' ? 0 : 1)}${unit} de ${safeTarget.toFixed(unit === 'mg' ? 0 : 1)}${unit}, ${percentage.toFixed(0)}% da meta.`}>
        <circle
          className="text-gray-200 stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className={`${colorClass} transition-all duration-500 ease-in-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dy=".3em"
          className={`fill-current ${colorClass} text-sm font-bold`}
        >
          {`${Math.min(100, percentage).toFixed(0)}%`}
        </text>
      </svg>
      <div className="text-center mt-1">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className={`text-xs ${colorClass}`}>
          {safeConsumed.toFixed(unit === 'mg' ? 0 : (unit === 'Kcal' ? 0 : 1))}{unit} / {safeTarget.toFixed(unit === 'mg' ? 0 : (unit === 'Kcal' ? 0 : 1))}{unit}
        </p>
      </div>
    </div>
  );
};

export default NutrientDonutChart;
