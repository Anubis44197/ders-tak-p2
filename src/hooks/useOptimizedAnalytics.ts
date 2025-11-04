import { useMemo } from 'react';
import { Task, Course } from '../../types';
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface OptimizedAnalytics {
  // Temel istatistikler
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalPoints: number;
  averageScore: number;
  
  // Ders bazlı analiz
  coursePerformance: {
    courseId: string;
    courseName: string;
    completedCount: number;
    averageSuccess: number;
    averageFocus: number;
    totalTime: number;
  }[];
  
  // Zaman bazlı analiz
  dailyStats: {
    date: string;
    completedTasks: number;
    totalPoints: number;
    averageScore: number;
  }[];
  
  // Görev türü analizi
  taskTypeAnalysis: {
    taskType: string;
    count: number;
    averageScore: number;
    totalTime: number;
  }[];
  
  // Trend analizi
  weeklyTrend: {
    week: string;
    performance: number;
    consistency: number;
  }[];
  
  // En iyi performans zamanları
  bestPerformancePeriods: {
    period: string;
    score: number;
    tasks: number;
  }[];
}

export const useOptimizedAnalytics = (
  tasks: Task[], 
  courses: Course[], 
  timeFilter?: { period: string; startDate?: string; endDate?: string }
): OptimizedAnalytics => {
  
  return useMemo(() => {
    console.log('🔄 Analytics hesaplanıyor...', { taskCount: tasks.length, courseCount: courses.length });
    
    // Filtrelenmiş görevleri hazırla
    const filteredTasks = useMemo(() => {
      if (!timeFilter || timeFilter.period === 'all') {
        return tasks.filter(t => t.status === 'tamamlandı');
      }
      
      const now = new Date();
      let interval: { start: Date; end: Date } | null = null;
      
      switch (timeFilter.period) {
        case 'week':
          interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
          break;
        case 'month':
          interval = { start: startOfMonth(now), end: endOfMonth(now) };
          break;
        case 'year':
          interval = { start: startOfYear(now), end: endOfYear(now) };
          break;
        case 'custom':
          if (timeFilter.startDate && timeFilter.endDate) {
            interval = { start: new Date(timeFilter.startDate), end: new Date(timeFilter.endDate) };
          }
          break;
      }
      
      if (!interval) {
        return tasks.filter(t => t.status === 'tamamlandı');
      }
      
      return tasks.filter(t => {
        if (t.status !== 'tamamlandı') return false;
        const analysisDate = t.completionDate || t.dueDate;
        if (!analysisDate) return false;
        const taskDate = new Date(analysisDate);
        return isWithinInterval(taskDate, interval!);
      });
    }, [tasks, timeFilter]);
    
    // Temel istatistikler
    const totalTasks = tasks.length;
    const completedTasks = filteredTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalPoints = filteredTasks.reduce((sum, task) => sum + (task.pointsAwarded || 0), 0);
    const averageScore = completedTasks > 0 
      ? Math.round(filteredTasks.reduce((sum, task) => sum + (task.successScore || 0), 0) / completedTasks)
      : 0;
    
    // Ders bazlı performans analizi
    const coursePerformance = useMemo(() => {
      const courseStats: { [key: string]: { 
        tasks: Task[];
        successScores: number[];
        focusScores: number[];
        totalTime: number;
      } } = {};
      
      filteredTasks.forEach(task => {
        if (!courseStats[task.courseId]) {
          courseStats[task.courseId] = { 
            tasks: [], 
            successScores: [], 
            focusScores: [], 
            totalTime: 0 
          };
        }
        courseStats[task.courseId].tasks.push(task);
        if (task.successScore) courseStats[task.courseId].successScores.push(task.successScore);
        if (task.focusScore) courseStats[task.courseId].focusScores.push(task.focusScore);
        courseStats[task.courseId].totalTime += task.actualDuration || 0;
      });
      
      return courses.map(course => {
        const stats = courseStats[course.id];
        if (!stats || stats.tasks.length === 0) {
          return {
            courseId: course.id,
            courseName: course.name,
            completedCount: 0,
            averageSuccess: 0,
            averageFocus: 0,
            totalTime: 0
          };
        }
        
        return {
          courseId: course.id,
          courseName: course.name,
          completedCount: stats.tasks.length,
          averageSuccess: stats.successScores.length > 0 
            ? Math.round(stats.successScores.reduce((a, b) => a + b, 0) / stats.successScores.length)
            : 0,
          averageFocus: stats.focusScores.length > 0 
            ? Math.round(stats.focusScores.reduce((a, b) => a + b, 0) / stats.focusScores.length)
            : 0,
          totalTime: Math.round(stats.totalTime / 60) // Convert to minutes
        };
      });
    }, [filteredTasks, courses]);
    
    // Günlük istatistikler
    const dailyStats = useMemo(() => {
      const dailyData: { [key: string]: { tasks: Task[]; points: number; } } = {};
      
      filteredTasks.forEach(task => {
        const date = task.completionDate || task.dueDate;
        if (!date) return;
        
        if (!dailyData[date]) {
          dailyData[date] = { tasks: [], points: 0 };
        }
        dailyData[date].tasks.push(task);
        dailyData[date].points += task.pointsAwarded || 0;
      });
      
      return Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          completedTasks: data.tasks.length,
          totalPoints: data.points,
          averageScore: data.tasks.length > 0
            ? Math.round(data.tasks.reduce((sum, task) => sum + (task.successScore || 0), 0) / data.tasks.length)
            : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredTasks]);
    
    // Görev türü analizi
    const taskTypeAnalysis = useMemo(() => {
      const typeStats: { [key: string]: { tasks: Task[]; totalTime: number; } } = {};
      
      filteredTasks.forEach(task => {
        if (!typeStats[task.taskType]) {
          typeStats[task.taskType] = { tasks: [], totalTime: 0 };
        }
        typeStats[task.taskType].tasks.push(task);
        typeStats[task.taskType].totalTime += task.actualDuration || 0;
      });
      
      return Object.entries(typeStats).map(([taskType, stats]) => ({
        taskType,
        count: stats.tasks.length,
        averageScore: stats.tasks.length > 0
          ? Math.round(stats.tasks.reduce((sum, task) => sum + (task.successScore || 0), 0) / stats.tasks.length)
          : 0,
        totalTime: Math.round(stats.totalTime / 60) // Convert to minutes
      }));
    }, [filteredTasks]);
    
    // Haftalık trend analizi
    const weeklyTrend = useMemo(() => {
      const getWeekKey = (date: Date) => {
        const year = date.getFullYear();
        const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
        return `${year}-W${week}`;
      };
      
      const weeklyData: { [key: string]: Task[] } = {};
      
      filteredTasks.forEach(task => {
        const date = task.completionDate || task.dueDate;
        if (!date) return;
        
        const weekKey = getWeekKey(new Date(date));
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = [];
        }
        weeklyData[weekKey].push(task);
      });
      
      return Object.entries(weeklyData).map(([week, tasks]) => {
        const averageScore = tasks.length > 0
          ? tasks.reduce((sum, task) => sum + (task.successScore || 0), 0) / tasks.length
          : 0;
        
        // Consistency: how many days in the week had completed tasks
        const uniqueDays = new Set(tasks.map(task => task.completionDate || task.dueDate)).size;
        const consistency = Math.round((uniqueDays / 7) * 100);
        
        return {
          week,
          performance: Math.round(averageScore),
          consistency
        };
      }).sort((a, b) => a.week.localeCompare(b.week));
    }, [filteredTasks]);
    
    // En iyi performans zamanları
    const bestPerformancePeriods = useMemo(() => {
      const hourlyStats: { [key: number]: { scores: number[]; taskCount: number; } } = {};
      
      filteredTasks.forEach(task => {
        if (!task.completionTimestamp || !task.successScore) return;
        
        const hour = new Date(task.completionTimestamp).getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { scores: [], taskCount: 0 };
        }
        hourlyStats[hour].scores.push(task.successScore);
        hourlyStats[hour].taskCount++;
      });
      
      return Object.entries(hourlyStats)
        .map(([hour, stats]) => ({
          period: `${hour.padStart(2, '0')}:00-${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
          score: stats.scores.length > 0 
            ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
            : 0,
          tasks: stats.taskCount
        }))
        .filter(period => period.tasks >= 2) // En az 2 görev olmalı
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Top 5
    }, [filteredTasks]);
    
    console.log('✅ Analytics hesaplandı!', { 
      totalTasks, 
      completedTasks, 
      coursePerformanceCount: coursePerformance.length,
      dailyStatsCount: dailyStats.length 
    });
    
    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalPoints,
      averageScore,
      coursePerformance,
      dailyStats,
      taskTypeAnalysis,
      weeklyTrend,
      bestPerformancePeriods
    };
    
  }, [tasks, courses, timeFilter]); // Sadece bu değerler değişirse yeniden hesapla
};

export default useOptimizedAnalytics;