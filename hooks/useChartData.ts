import { useMemo } from 'react';
import { Task } from '../types';
import { processChartData, processWeeklyData, processMonthlyTrends } from '../utils/chartDataProcessor';

/**
 * 📊 Chart Data Management Hook
 * Grafik verilerini optimize edilmiş şekilde yönetir
 */

export interface ChartDataHookResult {
  dailyData: ReturnType<typeof processChartData>;
  weeklyData: ReturnType<typeof processWeeklyData>;
  monthlyData: ReturnType<typeof processMonthlyTrends>;
  hasData: boolean;
  dataCount: number;
}

export const useChartData = (
  tasks: Task[], 
  monthsBack: number = 9
): ChartDataHookResult => {
  
  // Memoized data processing for performance
  const dailyData = useMemo(() => 
    processChartData(tasks, monthsBack), 
    [tasks, monthsBack]
  );
  
  const weeklyData = useMemo(() => 
    processWeeklyData(tasks, monthsBack * 4), 
    [tasks, monthsBack]
  );
  
  const monthlyData = useMemo(() => 
    processMonthlyTrends(tasks, monthsBack), 
    [tasks, monthsBack]
  );

  // Data availability check
  const hasData = useMemo(() => 
    dailyData.length > 0 || weeklyData.length > 0 || monthlyData.length > 0,
    [dailyData.length, weeklyData.length, monthlyData.length]
  );

  // Total data count
  const dataCount = useMemo(() => 
    tasks.filter(t => t.status === 'tamamlandı').length,
    [tasks]
  );

  return {
    dailyData,
    weeklyData, 
    monthlyData,
    hasData,
    dataCount
  };
};

/**
 * Course-specific chart data hook
 */
export const useCourseChartData = (
  tasks: Task[],
  courseId: string,
  monthsBack: number = 9
) => {
  const courseFilteredTasks = useMemo(() => 
    tasks.filter(task => task.courseId === courseId),
    [tasks, courseId]
  );

  return useChartData(courseFilteredTasks, monthsBack);
};

/**
 * Task type specific chart data hook
 */
export const useTaskTypeChartData = (
  tasks: Task[],
  taskType: string,
  monthsBack: number = 9
) => {
  const typeFilteredTasks = useMemo(() => 
    tasks.filter(task => task.taskType === taskType),
    [tasks, taskType]
  );

  return useChartData(typeFilteredTasks, monthsBack);
};