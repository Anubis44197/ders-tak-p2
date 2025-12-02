import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import {
    BarChart as BarChartIcon, BookOpen, ClipboardList, FileText, Home, PlusCircle, Trash2,
    TrendingUp, TrendingDown, CheckCircle, Clock, ListFilter, Brain, Zap, Gift, Printer,
    Download, ArrowUpDown, Trophy, Sparkles, BookMarked, AlertTriangle, Info, Settings, Send,
    Smile, Frown, Meh, Star, Award, Play, Pause, XCircle
} from '../icons';
import { getIconComponent } from '../../constants';
import {
    DailyBriefingData, PerformanceData, ReportData, Task, ParentDashboardProps,
    Course, Reward, Exam, ExamResult, TaskCompletionData
} from '../../types';
import { GoogleGenAI } from "@google/genai";
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { getLocalDateString, getShortDisplayDate, getDaysAgo, parseDate, isSameDay } from '../../utils/dateUtils';
import { processChartData, processWeeklyData, processMonthlyTrends } from '../../utils/chartDataProcessor';
import TimeRangeFilter, { type TimeFilterValue } from '../shared/TimeRangeFilter';
import EmptyState from '../shared/EmptyState';
import Modal from './shared/Modal'; // For components that use Modal
import StatCard from './shared/StatCard'; // For components that use StatCard


const ExamPerformanceChart: React.FC<{ exams: Exam[] }> = ({ exams }) => {
    const data = useMemo(() => {
        return [...exams]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(e => ({
                name: e.title, // Or date
                date: e.date,
                net: e.totalNet
            }));
    }, [exams]);

    if (exams.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                Sınav Performans Grafiği
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                    <XAxis dataKey="date" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="net" name="Toplam Net" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const PerformanceAnalytics: React.FC<{
    tasks: Task[],
    courses: Course[],
    exams: Exam[],
    ai: GoogleGenAI | null,
    timeFilter: TimeFilterValue,
    onTimeFilterChange?: React.Dispatch<React.SetStateAction<TimeFilterValue>>
}> = ({ tasks, courses, exams, ai, timeFilter, onTimeFilterChange }) => {

    // Activity Trend Data (Area Chart)
    const activityData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayTasks = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate === date);
            const totalDuration = dayTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60; // Minutes
            const questionCount = dayTasks.reduce((acc, t) => acc + (t.questionCount || 0), 0);

            return {
                name: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }),
                date: date,
                "Çalışma Süresi (dk)": Math.round(totalDuration),
                "Soru Sayısı": questionCount
            };
        });
    }, [tasks]);

    // Weekly Course Distribution (Stacked Bar)
    const weeklyDistribution = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayTasks = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate === date);
            const entry: any = { name: new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }) };

            courses.forEach(c => {
                const courseTasks = dayTasks.filter(t => t.courseId === c.id);
                // We can sum duration or questions. Let's sum duration for now.
                const duration = courseTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60;
                if (duration > 0) entry[c.name] = Math.round(duration);
            });
            return entry;
        });
    }, [tasks, courses]);

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    const summaryStats = useMemo(() => {
        const d = new Date();
        const day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1);
        const startOfThisWeek = new Date(d.setDate(diff)).setHours(0, 0, 0, 0);

        const completedTasks = tasks.filter(t => t.status === 'tamamlandı');

        const todayStr = new Date().toISOString().split('T')[0];

        const todayTasks = completedTasks.filter(t => t.completionDate === todayStr);
        const weekTasks = completedTasks.filter(t => {
            if (!t.completionDate) return false;
            return new Date(t.completionDate).getTime() >= startOfThisWeek;
        });

        const todayDuration = Math.round(todayTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60);
        const weekQuestions = weekTasks.reduce((acc, t) => acc + (t.questionCount || 0), 0);
        const weekDuration = Math.round(weekTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60);

        return { todayDuration, weekQuestions, weekDuration };
    }, [tasks]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 font-semibold">Bugün Çalışma</p>
                    <p className="text-2xl font-bold text-blue-800">{summaryStats.todayDuration} dk</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <p className="text-sm text-purple-600 font-semibold">Bu Hafta Soru</p>
                    <p className="text-2xl font-bold text-purple-800">{summaryStats.weekQuestions} Soru</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-sm text-green-600 font-semibold">Bu Hafta Süre</p>
                    <p className="text-2xl font-bold text-green-800">{summaryStats.weekDuration} dk</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                        Haftalık Aktivite Trendi
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="Çalışma Süresi (dk)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDuration)" />
                            <Area yAxisId="right" type="monotone" dataKey="Soru Sayısı" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <BarChartIcon className="w-6 h-6 mr-2 text-purple-600" />
                        Ders Dağılımı (Haftalık)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {courses.map((course, index) => (
                                <Bar key={course.id} dataKey={course.name} stackId="a" fill={colors[index % colors.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <ExamPerformanceChart exams={exams} />
        </div>
    );
};


export default PerformanceAnalytics;
