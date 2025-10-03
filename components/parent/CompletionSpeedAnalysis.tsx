import React, { useMemo } from 'react';
import { Task } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap } from '../icons';
import EmptyState from '../shared/EmptyState';

interface CompletionSpeedAnalysisProps {
  tasks: Task[];
}

const CompletionSpeedAnalysis: React.FC<CompletionSpeedAnalysisProps> = ({ tasks }) => {
  // Sadece tamamlanmış ve planlanan/gerçek süreleri olan görevler
  const completed = useMemo(() => tasks.filter(t => t.status === 'tamamlandı' && typeof t.plannedDuration === 'number' && typeof t.actualDuration === 'number'), [tasks]);

  // Planlanan ve gerçek sürelerin karşılaştırılması (dk cinsinden)
  const data = useMemo(() => {
    // Son 20 görevi göster (en güncelden eskiye)
    return completed.slice(-20).map(t => ({
      title: t.title.length > 18 ? t.title.slice(0, 15) + '...' : t.title,
      'Planlanan Süre': t.plannedDuration,
      'Gerçek Süre': Math.round((t.actualDuration || 0) / 60),
    }));
  }, [completed]);

  if (completed.length === 0) {
    return <EmptyState icon={<Zap className="w-8 h-8 text-slate-400" />} title="Tamamlanma Hızı Analizi İçin Veri Yok" message="Çocuğunuz görevleri tamamladıkça, planlanan ve gerçek süre karşılaştırması burada görünecek." />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center"><Zap className="w-6 h-6 mr-2 text-primary-600" />Tamamlanma Hızı Analizi</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" fontSize={12} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis label={{ value: 'dk', angle: -90, position: 'insideLeft', offset: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Planlanan Süre" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gerçek Süre" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2">Son 20 tamamlanmış görev için planlanan ve gerçek süre karşılaştırması.</p>
    </div>
  );
};

export default CompletionSpeedAnalysis;
