import React, { useMemo, useState } from 'react';
import { Task } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  tasks: Task[];
}

type Period = 'Günlük' | 'Haftalık' | 'Aylık';

function getPeriodKey(date: string, period: Period) {
  const d = new Date(date);
  if (period === 'Günlük') return d.toISOString().slice(0, 10);
  if (period === 'Haftalık') {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - jan1.getTime()) / (24*60*60*1000));
    return `${d.getFullYear()}-H${Math.ceil((days + jan1.getDay() + 1) / 7)}`;
  }
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
}

const taskTypeLabels = {
  'soru çözme': 'Soru Çözme',
  'ders çalışma': 'Ders Çalışma',
  'kitap okuma': 'Kitap Okuma',
};

const TaskTypeAnalysis: React.FC<Props> = ({ tasks }) => {
  const [period, setPeriod] = useState<Period>('Haftalık');

  // Periyot ve görev türüne göre analiz
  const data = useMemo(() => {
    const filtered = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate && t.successScore != null && t.actualDuration != null);
    const grouped: Record<string, Record<string, { totalScore: number, totalDuration: number, count: number }>> = {};
    filtered.forEach(t => {
      const pKey = getPeriodKey(t.completionDate!, period);
      if (!grouped[pKey]) grouped[pKey] = {};
      if (!grouped[pKey][t.taskType]) grouped[pKey][t.taskType] = { totalScore: 0, totalDuration: 0, count: 0 };
      grouped[pKey][t.taskType].totalScore += t.successScore!;
      grouped[pKey][t.taskType].totalDuration += t.actualDuration!;
      grouped[pKey][t.taskType].count++;
    });
    // Son periyodu al (en güncel)
    const lastPeriod = Object.keys(grouped).sort().pop();
    const result = [];
    if (lastPeriod) {
      for (const type of Object.keys(taskTypeLabels)) {
        const entry = grouped[lastPeriod][type];
        result.push({
          taskType: taskTypeLabels[type as keyof typeof taskTypeLabels],
          avgScore: entry ? Math.round(entry.totalScore / entry.count) : 0,
          avgDuration: entry ? Math.round(entry.totalDuration / entry.count / 60) : 0, // dakika
        });
      }
    }
    return result;
  }, [tasks, period]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-lg">Görev Türü Analizi</h4>
        <div className="flex gap-2">
          {(['Günlük','Haftalık','Aylık'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded ${period===p?'bg-primary-600 text-white':'bg-slate-100 text-slate-700'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map(d => (
          <div key={d.taskType} className="bg-primary-50 p-4 rounded-lg text-center">
            <div className="text-sm text-slate-500 font-semibold mb-1">{d.taskType}</div>
            <div className="text-2xl font-bold text-primary-700">{d.avgScore} <span className="text-base font-normal">puan</span></div>
            <div className="text-slate-600 text-sm">Ortalama Süre: {d.avgDuration} dk</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="taskType" fontSize={12} />
          <YAxis yAxisId="left" orientation="left" label={{ value: 'Başarı', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Süre (dk)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="avgScore" name="Başarı Puanı" fill="#3b82f6" />
          <Bar yAxisId="right" dataKey="avgDuration" name="Ortalama Süre (dk)" fill="#f59e42" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskTypeAnalysis;
