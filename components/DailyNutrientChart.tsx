import React from 'react';
import { NutrientInfo } from '../types';

interface DailyNutrientChartProps {
  consumedNutrients: NutrientInfo;
  targetNutrients: NutrientInfo;
  className?: string;
}

const NUTRIENTS_TO_CHART: Array<{ key: keyof NutrientInfo; label: string; unit: string }> = [
  { key: 'Proteína', label: 'Proteína', unit: 'g' },
  { key: 'Carboidrato', label: 'Carboidrato', unit: 'g' },
  { key: 'Lipídeos', label: 'Lipídeos', unit: 'g' },
];

const DailyNutrientChart: React.FC<DailyNutrientChartProps> = ({ consumedNutrients, targetNutrients, className = '' }) => {
  const svgWidth = 320;
  const svgHeight = 200;
  const chartPadding = { top: 20, right: 20, bottom: 50, left: 40 }; // Increased bottom for legend
  const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
  const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;

  const barGroupWidth = chartWidth / NUTRIENTS_TO_CHART.length;
  const barPadding = 0.3; // Relative padding between bar groups
  const barWidth = (barGroupWidth * (1 - barPadding)) / 2; // Width of individual consumed/target bar

  const maxNutrientValue = Math.max(
    10, // Minimum value for y-axis to avoid division by zero or too small scale
    ...NUTRIENTS_TO_CHART.map(({ key }) => Math.max(consumedNutrients[key] || 0, targetNutrients[key] || 0))
  );

  const yScale = chartHeight / maxNutrientValue;

  const consumedColor = "fill-emerald-500";
  const targetColor = "fill-gray-300";

  // Y-axis ticks (simple version: 0, half, max)
  const yTicks = [
    { value: 0, label: "0" },
    { value: maxNutrientValue / 2, label: (maxNutrientValue / 2).toFixed(0) },
    { value: maxNutrientValue, label: maxNutrientValue.toFixed(0) },
  ];

  return (
    <div className={`bg-gray-50 p-3 rounded-lg shadow-inner ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Comparativo de Macronutrientes (g)</h4>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} role="figure" aria-labelledby="chart-title-macros">
        <title id="chart-title-macros">Gráfico de Comparação de Macronutrientes Consumidos vs. Metas</title>
        {/* Y-axis labels and lines */}
        {yTicks.map(tick => (
          <g key={`ytick-${tick.value}`}>
            <line
              x1={chartPadding.left - 5}
              y1={chartPadding.top + chartHeight - (tick.value * yScale)}
              x2={chartPadding.left + chartWidth}
              y2={chartPadding.top + chartHeight - (tick.value * yScale)}
              stroke="#e5e7eb" 
              strokeDasharray="2,2"
            />
            <text
              x={chartPadding.left - 10}
              y={chartPadding.top + chartHeight - (tick.value * yScale) + 3} // Adjust y for alignment
              textAnchor="end"
              fontSize="8px"
              fill="#6b7280"
            >
              {tick.label}
            </text>
          </g>
        ))}
        
        {/* X-axis line */}
        <line
            x1={chartPadding.left}
            y1={chartPadding.top + chartHeight}
            x2={chartPadding.left + chartWidth}
            y2={chartPadding.top + chartHeight}
            stroke="#9ca3af"
        />

        {NUTRIENTS_TO_CHART.map((nutrient, index) => {
          const consumedValue = consumedNutrients[nutrient.key] || 0;
          const targetValue = targetNutrients[nutrient.key] || 0;

          const consumedBarHeight = consumedValue * yScale;
          const targetBarHeight = targetValue * yScale;

          const groupX = chartPadding.left + index * barGroupWidth + (barGroupWidth * barPadding / 2);
          const consumedBarX = groupX;
          const targetBarX = groupX + barWidth;

          return (
            <g key={nutrient.key} aria-label={`Dados para ${nutrient.label}`}>
              {/* Consumed Bar */}
              <rect
                x={consumedBarX}
                y={chartPadding.top + chartHeight - consumedBarHeight}
                width={barWidth}
                height={consumedBarHeight}
                className={consumedColor}
                aria-label={`Consumido ${nutrient.label}: ${consumedValue.toFixed(1)}g`}
              >
                <title>{`Consumido ${nutrient.label}: ${consumedValue.toFixed(1)}g`}</title>
              </rect>
              <text
                x={consumedBarX + barWidth / 2}
                y={chartPadding.top + chartHeight - consumedBarHeight - 3}
                textAnchor="middle"
                fontSize="7px"
                fill="#374151"
              >
                {consumedValue.toFixed(0)}
              </text>

              {/* Target Bar */}
              <rect
                x={targetBarX}
                y={chartPadding.top + chartHeight - targetBarHeight}
                width={barWidth}
                height={targetBarHeight}
                className={targetColor}
                aria-label={`Meta ${nutrient.label}: ${targetValue.toFixed(1)}g`}
              >
                 <title>{`Meta ${nutrient.label}: ${targetValue.toFixed(1)}g`}</title>
              </rect>
               <text
                x={targetBarX + barWidth / 2}
                y={chartPadding.top + chartHeight - targetBarHeight - 3}
                textAnchor="middle"
                fontSize="7px"
                fill="#374151"
              >
                {targetValue.toFixed(0)}
              </text>

              {/* Nutrient Label on X-axis */}
              <text
                x={groupX + barWidth} 
                y={chartPadding.top + chartHeight + 12}
                textAnchor="middle"
                fontSize="8px"
                fill="#4b5563"
                className="font-medium"
              >
                {nutrient.label}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartPadding.left + chartWidth / 2 - 50}, ${svgHeight - 15})`} aria-label="Legenda do gráfico">
          <rect x="0" y="0" width={barWidth/2} height="8" className={consumedColor} />
          <text x={barWidth/2 + 5} y="7" fontSize="8px" fill="#4b5563">Consumido</text>
          <rect x="50" y="0" width={barWidth/2} height="8" className={targetColor} />
          <text x={barWidth/2 + 55} y="7" fontSize="8px" fill="#4b5563">Meta</text>
        </g>
      </svg>
    </div>
  );
};

export default DailyNutrientChart;
