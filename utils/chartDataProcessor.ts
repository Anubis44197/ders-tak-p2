import { Task } from '../types';
import { 
  startOfDay, 
  endOfDay, 
  subMonths, 
  format, 
  isAfter, 
  isBefore, 
  parseISO, 
  isValid
} from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * 📊 Grafik Veri İşleme Optimizasyonu
 * Bu dosya grafik verilerinin doğru tarih aralığında ve performanslı işlenmesini sağlar
 */

export interface ProcessedChartData {
  date: string;
  displayDate: string;
  analysisDate: string;
  successScore: number | null;
  focusScore: number | null;
  taskCount: number;
}

/**
 * 9 aylık grafik verisi için optimize edilmiş işleme
 */
export const processChartData = (
  tasks: Task[], 
  monthsBack: number = 9
): ProcessedChartData[] => {
  // 1. Tarih aralığını belirle (9 ay geriye)
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subMonths(new Date(), monthsBack));
  
  // 2. Sadece tamamlanmış ve tarih aralığında olan görevleri filtrele
  const validTasks = tasks.filter(task => {
    if (task.status !== 'tamamlandı') return false;
    
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return false;
    
    return isAfter(taskDate, startDate) && isBefore(taskDate, endDate);
  });

  // 3. Tarihe göre gruplandır
  const groupedByDate = validTasks.reduce((acc, task) => {
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return acc;
    
    const dateKey = format(taskDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    
    return acc;
  }, {} as Record<string, Task[]>);

  // 4. Her gün için analiz verisi hazırla
  const processedData = Object.entries(groupedByDate)
    .map(([dateKey, dayTasks]) => {
      const dateObj = parseISO(dateKey);
      
      // Geçerli puanları olan görevleri filtrele
      const tasksWithSuccessScore = dayTasks.filter(
        t => typeof t.successScore === 'number' && t.successScore >= 0
      );
      const tasksWithFocusScore = dayTasks.filter(
        t => typeof t.focusScore === 'number' && t.focusScore >= 0
      );

      // Ortalama puanları hesapla
      const avgSuccessScore = tasksWithSuccessScore.length > 0
        ? Math.round(
            tasksWithSuccessScore.reduce((sum, t) => sum + (t.successScore || 0), 0) / 
            tasksWithSuccessScore.length
          )
        : null;
        
      const avgFocusScore = tasksWithFocusScore.length > 0
        ? Math.round(
            tasksWithFocusScore.reduce((sum, t) => sum + (t.focusScore || 0), 0) / 
            tasksWithFocusScore.length
          )
        : null;

      return {
        date: dateKey,
        displayDate: format(dateObj, 'E dd MMM', { locale: tr }), // Paz 15 Kas
        analysisDate: dateKey,
        successScore: avgSuccessScore,
        focusScore: avgFocusScore,
        taskCount: dayTasks.length
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date)); // Tarihe göre sırala

  return processedData;
};

/**
 * Görevden analiz tarihini güvenli şekilde çıkarır
 */
export const getTaskAnalysisDate = (task: Task): Date | null => {
  // Öncelik sırası: completionDate > dueDate > createdAt
  const dateString = task.completionDate || task.dueDate || task.createdAt;
  
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Haftalık performans verisi işleme
 */
export const processWeeklyData = (tasks: Task[], weeksBack: number = 12) => {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subMonths(new Date(), Math.floor(weeksBack / 4)));
  
  const validTasks = tasks.filter(task => {
    if (task.status !== 'tamamlandı') return false;
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return false;
    return isAfter(taskDate, startDate) && isBefore(taskDate, endDate);
  });

  // Haftaya göre gruplandır
  const weeklyData = validTasks.reduce((acc, task) => {
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return acc;
    
    const weekKey = format(taskDate, "yyyy-'W'ww", { locale: tr });
    if (!acc[weekKey]) acc[weekKey] = [];
    acc[weekKey].push(task);
    
    return acc;
  }, {} as Record<string, Task[]>);

  return Object.entries(weeklyData)
    .map(([weekKey, weekTasks]) => ({
      week: weekKey,
      completed: weekTasks.length,
      duration: Math.round(
        weekTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / 60
      ),
      avgSuccessScore: weekTasks.filter(t => typeof t.successScore === 'number').length > 0
        ? Math.round(
            weekTasks
              .filter(t => typeof t.successScore === 'number')
              .reduce((sum, t) => sum + (t.successScore || 0), 0) /
            weekTasks.filter(t => typeof t.successScore === 'number').length
          )
        : null
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
};

/**
 * Aylık trend analizi
 */
export const processMonthlyTrends = (tasks: Task[], monthsBack: number = 9) => {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subMonths(new Date(), monthsBack));
  
  const validTasks = tasks.filter(task => {
    if (task.status !== 'tamamlandı') return false;
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return false;
    return isAfter(taskDate, startDate) && isBefore(taskDate, endDate);
  });

  const monthlyData = validTasks.reduce((acc, task) => {
    const taskDate = getTaskAnalysisDate(task);
    if (!taskDate) return acc;
    
    const monthKey = format(taskDate, 'yyyy-MM', { locale: tr });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(task);
    
    return acc;
  }, {} as Record<string, Task[]>);

  return Object.entries(monthlyData)
    .map(([monthKey, monthTasks]) => {
      const monthDate = parseISO(`${monthKey}-01`);
      
      return {
        month: monthKey,
        displayMonth: format(monthDate, 'MMM yyyy', { locale: tr }),
        completed: monthTasks.length,
        totalDuration: Math.round(
          monthTasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0) / 60
        ),
        avgSuccessScore: monthTasks.filter(t => typeof t.successScore === 'number').length > 0
          ? Math.round(
              monthTasks
                .filter(t => typeof t.successScore === 'number')
                .reduce((sum, t) => sum + (t.successScore || 0), 0) /
              monthTasks.filter(t => typeof t.successScore === 'number').length
            )
          : null,
        avgFocusScore: monthTasks.filter(t => typeof t.focusScore === 'number').length > 0
          ? Math.round(
              monthTasks
                .filter(t => typeof t.focusScore === 'number')
                .reduce((sum, t) => sum + (t.focusScore || 0), 0) /
              monthTasks.filter(t => typeof t.focusScore === 'number').length
            )
          : null
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
};