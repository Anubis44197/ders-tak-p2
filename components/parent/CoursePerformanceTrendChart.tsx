import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { processChartData } from '../../utils/chartDataProcessor';

interface Props {
  data: Array<{
    period: string;
    successScore: number | null;
    focusScore: number | null;
    courseName: string;
  }>;
  courseName: string;
}

const CoursePerformanceTrendChart: React.FC<Props> = React.memo(({ data, courseName }) => {
  // Data processing memoization for performance
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      // Null değerleri handle et
      successScore: item.successScore ?? 0,
      focusScore: item.focusScore ?? 0
    }));
  }, [data]);

  // Chart configuration memoization
  const chartConfig = useMemo(() => ({
    margin: { top: 5, right: 20, left: 0, bottom: 60 },
    shouldShowBrush: processedData.length > 5
  }), [processedData.length]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h4 className="font-bold text-lg mb-2">{courseName} Dersi Performans Gelişimi</h4>
      <div className="text-xs text-slate-500 mb-4">📊 Grafik üzerinde kaydırarak yakınlaştırma yapabilirsiniz</div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={processedData} margin={chartConfig.margin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" fontSize={12} />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip 
            formatter={(value, name) => [
              value !== null ? `${value}%` : 'Veri yok', 
              name
            ]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="successScore" 
            name="Başarı Puanı" 
            stroke="#3b82f6" 
            strokeWidth={2}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="focusScore" 
            name="Odak Puanı" 
            stroke="#f59e42" 
            strokeWidth={2}
            connectNulls={false}
          />
          {chartConfig.shouldShowBrush && (
            <Brush 
              dataKey="period" 
              height={30} 
              stroke="#8884d8"
              fill="#f1f5f9"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

// Display name for React DevTools
CoursePerformanceTrendChart.displayName = 'CoursePerformanceTrendChart';

export default CoursePerformanceTrendChart;
