import React, { useMemo } from 'react';
import { Task } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from '../icons';
import EmptyState from '../shared/EmptyState';

interface BestPeriodAnalysisProps {
  tasks: Task[];
}

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const BestPeriodAnalysis: React.FC<BestPeriodAnalysisProps> = ({ tasks }) => {
  // Sadece tamamlanmış ve başarı puanı olan görevler
  const completed = useMemo(() => tasks.filter(t => t.status === 'tamamlandı' && typeof t.successScore === 'number' && t.completionTimestamp), [tasks]);

  // Haftanın günü bazında ortalama başarı puanı
  const weekdayData = useMemo(() => {
    const dayStats: { [key: number]: { total: number, count: number } } = {};
    completed.forEach(t => {
      const d = new Date(t.completionTimestamp!);
      const day = d.getDay();
      if (!dayStats[day]) dayStats[day] = { total: 0, count: 0 };
      dayStats[day].total += t.successScore!;
      dayStats[day].count++;
    });
    return WEEKDAYS.map((name, i) => ({
      day: name,
      'Başarı': dayStats[i]?.count ? Math.round(dayStats[i].total / dayStats[i].count) : 0,
      'Görev': dayStats[i]?.count || 0
    }));
  }, [completed]);

  // Saat dilimi bazında ortalama başarı puanı
  const hourData = useMemo(() => {
    const hourStats: { [key: number]: { total: number, count: number } } = {};
    completed.forEach(t => {
      const d = new Date(t.completionTimestamp!);
      const hour = d.getHours();
      if (!hourStats[hour]) hourStats[hour] = { total: 0, count: 0 };
      hourStats[hour].total += t.successScore!;
      hourStats[hour].count++;
    });
    return HOURS.map((h, i) => ({
      hour: h,
      'Başarı': hourStats[i]?.count ? Math.round(hourStats[i].total / hourStats[i].count) : 0,
      'Görev': hourStats[i]?.count || 0
    }));
  }, [completed]);

  if (completed.length === 0) {
    return <EmptyState icon={<Clock className="w-8 h-8 text-slate-400" />} title="Verimli Zaman Analizi İçin Veri Yok" message="Çocuğunuz görevleri tamamladıkça, en verimli gün ve saatler burada görünecek." />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center"><Clock className="w-6 h-6 mr-2 text-primary-600" />En Verimli Gün ve Saatler</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold mb-2">Haftanın Günleri</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekdayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Başarı" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Görev" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Saat Dilimleri</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" fontSize={12} interval={2} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Başarı" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Görev" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BestPeriodAnalysis;
