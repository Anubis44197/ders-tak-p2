import React, { useMemo } from 'react';
import { Task, Course } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BookOpen, Loader } from '../icons';
import EmptyState from '../shared/EmptyState';

interface CourseTimeDistributionProps {
  tasks: Task[];
  courses: Course[];
  loading?: boolean;
  error?: string | null;
}

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Loader className="w-8 h-8 animate-spin text-primary-600" />
    <span className="ml-2 text-slate-600">Veriler yükleniyor...</span>
  </div>
);

// Error State Component
const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
      <span className="text-red-500 text-xl">⚠️</span>
    </div>
    <p className="text-slate-600 mb-2">Veriler yüklenirken bir sorun oluştu</p>
    <p className="text-sm text-slate-500">{error}</p>
  </div>
);

const COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6366f1', '#f472b6', '#14b8a6', '#f43f5e', '#a3e635', '#eab308', '#0ea5e9'
];

const CourseTimeDistribution: React.FC<CourseTimeDistributionProps> = React.memo(({ tasks, courses, loading = false, error = null }) => {
  // Sadece tamamlanmış ve gerçek süresi olan görevler - performance optimized
  const completed = useMemo(() => {
    return tasks.filter(t => t.status === 'tamamlandı' && typeof t.actualDuration === 'number' && t.actualDuration > 0);
  }, [tasks]);

  // Ders bazında toplam süre (dk) - optimized calculation
  const data = useMemo(() => {
    if (completed.length === 0 || courses.length === 0) return [];

    const totals: { [key: string]: number } = {};
    
    // Single pass through completed tasks for better performance
    completed.forEach(task => {
      if (!totals[task.courseId]) totals[task.courseId] = 0;
      totals[task.courseId] += Math.round((task.actualDuration || 0) / 60);
    });
    
    // Only process courses that have data
    return courses
      .map((course, index) => ({
        name: course.name,
        value: totals[course.id] || 0,
        color: COLORS[index % COLORS.length]
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value); // Sort by value for better visualization
  }, [completed, courses]);

  // Chart configuration memoization
  const chartConfig = useMemo(() => ({
    outerRadius: 110,
    labelFormatter: (name: string, percent: number) => `${name}: ${(percent * 100).toFixed(1)}%`,
    tooltipFormatter: (value: number) => [`${value} dk`, 'Toplam Süre']
  }), []);

  // Handle loading state
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
          Ders Bazında Süre Dağılımı
        </h3>
        <LoadingSpinner />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
          Ders Bazında Süre Dağılımı
        </h3>
        <ErrorState error={error} />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={<BookOpen className="w-8 h-8 text-slate-400" />} title="Ders Bazında Süre Dağılımı İçin Veri Yok" message="Çocuğunuz görevleri tamamladıkça, derslere harcanan süre dağılımı burada görünecek." />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <BookOpen className="w-6 h-6 mr-2 text-primary-600" />
        Ders Bazında Süre Dağılımı
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={chartConfig.outerRadius}
            label={({ name, percent }: any) => chartConfig.labelFormatter(name, percent)}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={chartConfig.tooltipFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2">
        Tamamlanan görevler için derslere harcanan toplam süre (dakika) oranı.
        {data.length > 0 && ` Toplam ${data.reduce((sum, item) => sum + item.value, 0)} dakika.`}
      </p>
    </div>
  );
});

// Display name for React DevTools
CourseTimeDistribution.displayName = 'CourseTimeDistribution';

export default CourseTimeDistribution;
