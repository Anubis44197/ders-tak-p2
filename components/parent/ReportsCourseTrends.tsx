import React from 'react';
import CoursePerformanceTrendChart from './CoursePerformanceTrendChart';
import { Task, Course } from '../../types';

interface Props {
  tasks: Task[];
  courses: Course[];
  period: 'Haftalık' | 'Aylık';
}

// Yardımcı: Görevleri haftalık/aylık periyotlara böler ve başarı/odak puanlarını toplar
function aggregateCoursePerformance(tasks: Task[], period: 'Haftalık' | 'Aylık') {
  // Sadece tamamlanmış görevler
  const completed = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate);
  const groupBy = (date: string) => {
    const d = new Date(date);
    if (period === 'Haftalık') {
      // ISO week number
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - jan1.getTime()) / (24*60*60*1000));
      return `${d.getFullYear()}-H${Math.ceil((days + jan1.getDay() + 1) / 7)}`;
    } else {
      return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
    }
  };
  // courseId -> period -> { successScore, focusScore, count }
  const result: Record<string, Record<string, { successScore: number, focusScore: number, count: number }>> = {};
  completed.forEach(t => {
    if (!t.courseId || t.successScore == null || t.focusScore == null || !t.completionDate) return;
    const p = groupBy(t.completionDate);
    if (!result[t.courseId]) result[t.courseId] = {};
    if (!result[t.courseId][p]) result[t.courseId][p] = { successScore: 0, focusScore: 0, count: 0 };
    result[t.courseId][p].successScore += t.successScore;
    result[t.courseId][p].focusScore += t.focusScore;
    result[t.courseId][p].count++;
  });
  // courseId -> [{ period, successScore, focusScore }]
  const out: Record<string, { period: string, successScore: number, focusScore: number }[]> = {};
  Object.entries(result).forEach(([courseId, periods]) => {
    out[courseId] = Object.entries(periods).map(([period, vals]) => ({
      period,
      successScore: Math.round(vals.successScore / vals.count),
      focusScore: Math.round(vals.focusScore / vals.count)
    })).sort((a,b) => a.period.localeCompare(b.period));
  });
  return out;
}

const ReportsCourseTrends: React.FC<Props> = ({ tasks, courses, period }) => {
  const dataByCourse = React.useMemo(() => aggregateCoursePerformance(tasks, period), [tasks, period]);
  return (
    <div className="space-y-8">
      {courses.map(course => (
        <CoursePerformanceTrendChart
          key={course.id}
          data={dataByCourse[course.id] || []}
          courseName={course.name}
        />
      ))}
    </div>
  );
};

export default ReportsCourseTrends;
