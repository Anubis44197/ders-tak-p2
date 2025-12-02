import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Task } from '../../types';

const WeeklyProgress: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const data = useMemo(() => {
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        return last7Days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.status === 'tamamlandı' && (t.completionDate === dateStr));
            const points = dayTasks.reduce((acc, t) => acc + (t.pointsAwarded || 0), 0);
            return {
                name: days[date.getDay()],
                points
            };
        });
    }, [tasks]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Haftalık Puan Grafiği</h3>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="points" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyProgress;