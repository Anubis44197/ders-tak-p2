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


const CoursesDashboard: React.FC<ParentDashboardProps> = ({ courses, tasks, addCourse, deleteCourse }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses.length > 0 ? courses[0].id : null);
    const [isManageModalOpen, setManageModalOpen] = useState(false);
    const defaultIcon = BookOpen;

    const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [selectedCourseId, courses]);

    const courseTasks = useMemo(() => tasks.filter(t => t.courseId === selectedCourseId), [selectedCourseId, tasks]);
    const completedTasks = useMemo(() => courseTasks.filter(t => t.status === 'tamamlandı'), [courseTasks]);
    const pendingTasks = useMemo(() => courseTasks.filter(t => t.status === 'bekliyor'), [courseTasks]);

    const courseStats = useMemo(() => {
        if (!selectedCourse) return null;

        const totalCorrect = completedTasks.reduce((sum, task) => sum + (task.correctCount || 0), 0);
        const totalIncorrect = completedTasks.reduce((sum, task) => sum + (task.incorrectCount || 0), 0);
        const totalTimeSeconds = completedTasks.reduce((sum, task) => sum + (task.actualDuration || 0), 0);
        const successRate = totalCorrect + totalIncorrect > 0 ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100) : 0;

        return {
            successRate,
            timeSpent: Math.round(totalTimeSeconds / 60) + ' dk',
            completedCount: completedTasks.length,
            pendingCount: pendingTasks.length
        };
    }, [selectedCourse, completedTasks, pendingTasks]);

    const weeklyPerformanceData = useMemo(() => {
        if (!selectedCourse) return [];

        const weeklyData: { [key: string]: { correct: number, incorrect: number } } = {};

        completedTasks.forEach(task => {
            const analysisDate = task.completionDate || task.dueDate;
            if (analysisDate) {
                const d = new Date(analysisDate);
                const oneJan = new Date(d.getFullYear(), 0, 1);
                const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
                const week = `Hafta ${weekNum}`;

                if (!weeklyData[week]) {
                    weeklyData[week] = { correct: 0, incorrect: 0 };
                }
                weeklyData[week].correct += task.correctCount || 0;
                weeklyData[week].incorrect += task.incorrectCount || 0;
            }
        });

        return Object.entries(weeklyData).map(([week, data]) => ({
            week,
            accuracy: (data.correct + data.incorrect > 0) ? Math.round((data.correct / (data.correct + data.incorrect)) * 100) : 0,
        })).sort((a, b) => parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1]));
    }, [selectedCourse, completedTasks]);

    const CourseTaskItem: React.FC<{ task: Task }> = ({ task }) => (
        <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold">{task.title}</p>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>Son Teslim: {task.dueDate}</span>
                {task.status === 'tamamlandı' && (
                    <div className="flex space-x-2 font-semibold">
                        <span className="text-green-600">D: {task.correctCount || 0}</span>
                        <span className="text-red-600">Y: {task.incorrectCount || 0}</span>
                        <span className="text-slate-600">{Math.round((task.actualDuration || 0) / 60)} dk</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex space-x-8">
            <Modal show={isManageModalOpen} onClose={() => setManageModalOpen(false)} title="Dersleri Yönet">
                <CoursesManager courses={courses} addCourse={addCourse} deleteCourse={deleteCourse} />
            </Modal>
            <aside className="w-1/4 space-y-2">
                <h3 className="text-lg font-bold px-4 mb-2">Dersler</h3>
                <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
                    {courses.length === 0 ? (
                        <div className="text-slate-500 text-center p-4">Henüz ders eklenmedi.</div>
                    ) : (
                        courses.map(course => {
                            const pendingCount = tasks.filter(t => t.courseId === course.id && t.status === 'bekliyor').length;
                            const Icon = course.icon || defaultIcon;
                            return (
                                <button aria-label={course.name} title={course.name}
                                    key={course.id}
                                    onClick={() => setSelectedCourseId(course.id)}
                                    className={`flex items-center justify-between w-full text-left px-4 py-3 rounded-lg transition-colors mb-2 ${selectedCourseId === course.id ? 'bg-primary-600 text-white font-semibold shadow-lg' : 'text-slate-600 hover:bg-primary-100 hover:text-primary-700'}`}
                                >
                                    <span className="flex items-center">
                                        {Icon && <Icon className="w-5 h-5" />}
                                        <span className="ml-3">{course.name}</span>
                                    </span>
                                    {pendingCount > 0 && <span className={`flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${selectedCourseId === course.id ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'}`}>{pendingCount}</span>}
                                </button>
                            )
                        })
                    )}
                </div>
                <button aria-label="Dersleri Yönet" title="Dersleri Yönet"
                    onClick={() => setManageModalOpen(true)}
                    className="flex items-center w-full text-left px-4 py-3 mt-4 rounded-lg transition-colors text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                    <ListFilter className="w-5 h-5" />
                    <span className="ml-3 font-semibold">Dersleri Yönet</span>
                </button>
            </aside>
            <main className="w-3/4">
                {courses.length === 0 ? (
                    <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md">
                        <p className="text-slate-500">Ders ekleyin ve analizleri burada görün.</p>
                    </div>
                ) : !selectedCourse ? (
                    <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md">
                        <p className="text-slate-500">Analizini görmek için bir ders seçin.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">{selectedCourse.name} Analizi</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Genel Başarı" value={courseStats?.successRate || 'N/A'} icon={<TrendingUp className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Toplam Süre" value={courseStats?.timeSpent || 'N/A'} icon={<Clock className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Biten Görevler" value={courseStats?.completedCount || 'N/A'} icon={<CheckCircle className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Bekleyen Görevler" value={courseStats?.pendingCount || 'N/A'} icon={<ClipboardList className="w-6 h-6 text-primary-600" />} />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4 flex items-center">Haftalık Performans Gelişimi (%) <div className="ml-2" title="Seçilen dersin haftalık performans yüzdesi değişimi"><Info className="w-4 h-4 text-slate-400 cursor-help" /></div></h3>
                            {weeklyPerformanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={weeklyPerformanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" fontSize={12} />
                                        <YAxis domain={[0, 100]} unit="%" />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="accuracy" name="Başarı" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState
                                    icon={<BarChartIcon className="w-8 h-8 text-slate-400" />}
                                    title="Performans Gelişimi İçin Veri Yok"
                                    message="Bu derste tamamlanmış görevler biriktikçe, haftalık başarı gelişimini gösteren grafik burada yer alacak."
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Bekleyen Görevler ({pendingTasks.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {pendingTasks.length > 0 ? pendingTasks.map(t => <CourseTaskItem key={t.id} task={t} />) : <p className="text-slate-500">Bekleyen görev yok.</p>}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Tamamlanan Görevler ({completedTasks.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {completedTasks.length > 0 ? completedTasks.map(t => <CourseTaskItem key={t.id} task={t} />) : <p className="text-slate-500">Tamamlanmış görev yok.</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};


export default CoursesDashboard;
