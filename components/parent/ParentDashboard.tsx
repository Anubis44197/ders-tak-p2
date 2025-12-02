import React, { useState, useMemo, useEffect } from 'react';
import { BarChart as BarChartIcon, BookOpen, ClipboardList, FileText, Home, PlusCircle, Trash2, TrendingUp, TrendingDown, CheckCircle, Clock, ListFilter, Brain, Zap, Gift, Printer, Download, ArrowUpDown, Trophy, Sparkles, BookMarked, AlertTriangle, Info, Settings, Send } from '../icons';
import { getIconComponent } from '../../constants';
import { DailyBriefingData, PerformanceData, ReportData, Task, ParentDashboardProps, Course, Reward, Exam, ExamResult } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import EmptyState from '../shared/EmptyState';
import ErrorBoundary from '../shared/ErrorBoundary';
import TaskTypeAnalysis from './TaskTypeAnalysis';
import BestPeriodAnalysis from './BestPeriodAnalysis';
import CompletionSpeedAnalysis from './CompletionSpeedAnalysis';
import CourseTimeDistribution from './CourseTimeDistribution';
import ReadingAnalytics from './ReadingAnalytics';

import DataManagementPanel from './DataManagementPanel';
import TimeRangeFilter, { type TimeFilterValue } from '../shared/TimeRangeFilter';
import RemoteNotificationCenter from '../shared/RemoteNotificationCenter';
import { useRemoteTaskManagement } from '../../src/hooks/useRemoteTaskManagement';
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { getLocalDateString, getShortDisplayDate, getDaysAgo, parseDate, isSameDay } from '../../utils/dateUtils';
import { processChartData, processWeeklyData, processMonthlyTrends } from '../../utils/chartDataProcessor';
import ReportsCourseTrends from './ReportsCourseTrends';
import RewardsManager from './RewardsManager';

import DailyBriefing from './DailyBriefing';
import Modal from './shared/Modal';
import StatCard from './shared/StatCard';
import CoursesManager from './CoursesManager';
import TaskManager from './TaskManager';
import ExamManager from './ExamManager';
import PerformanceAnalytics from './PerformanceAnalytics';
import CoursesDashboard from './CoursesDashboard';
import ReportsView from './ReportsView';
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




const ParentDashboard: React.FC<ParentDashboardProps> = (props) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ period: 'week' });

    // Derived state or mocks
    const isParent = true;
    const notifications = [
        { id: '1', title: 'Matematik Ödevi', message: 'Tamamlandı', read: false, date: new Date().toISOString() },
        { id: '2', title: 'Fizik Sınavı', message: 'Yarın', read: true, date: new Date().toISOString() }
    ];

    const NavLink: React.FC<{ view: string, icon: React.ReactNode, label: string, onClick?: () => void }> = ({ view, icon, label, onClick }) => (
        <button
            onClick={() => {
                setActiveView(view);
                if (onClick) onClick();
            }}
            className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${activeView === view ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </button>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                const totalPoints = props.tasks
                    .filter(t => t.status === 'tamamlandı')
                    .reduce((sum, t) => sum + (t.pointsAwarded || 0), 0);
                return (
                    <div className="space-y-8">
                        <DailyBriefing ai={props.ai} tasks={props.tasks} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Aktif Ders Sayısı" value={props.courses.length.toString()} icon={<BookOpen className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Bekleyen Görevler" value={props.tasks.filter(t => t.status === 'bekliyor').length.toString()} icon={<ClipboardList className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Tamamlanan Görevler (Haftalık)" value={props.tasks.filter(t => {
                                const analysisDate = t.completionDate || t.dueDate;
                                return t.status === 'tamamlandı' && analysisDate && new Date(analysisDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            }).length.toString()} icon={<CheckCircle className="w-6 h-6 text-primary-600" />} />
                            <StatCard title="Toplam Başarı Puanı" value={totalPoints.toString()} icon={<Trophy className="w-6 h-6 text-amber-500" />} />
                        </div>
                    </div>
                );
            case 'courses':
                return <CoursesDashboard {...props} />;
            case 'tasks':
                return <TaskManager tasks={props.tasks} courses={props.courses} addTask={props.addTask} deleteTask={props.deleteTask} />;
            case 'analytics':
                return <PerformanceAnalytics
                    tasks={props.tasks}
                    courses={props.courses}
                    exams={props.exams}
                    ai={props.ai}
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                />;
            case 'exams':
                return <ExamManager courses={props.courses} exams={props.exams} tasks={props.tasks} deleteExam={props.deleteExam} deleteTask={props.deleteTask} />;
            case 'reading':
                return <ReadingAnalytics tasks={props.tasks} />;
            case 'reports':
                return <ReportsView
                    generateReport={props.generateReport}
                    courses={props.courses}
                    tasks={props.tasks}
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                />;
            case 'rewards':
                return <RewardsManager rewards={props.rewards} addReward={props.addReward} deleteReward={props.deleteReward} />;
            case 'datamanagement':
                return <DataManagementPanel onDeleteAllData={props.onDeleteAllData} onExportData={props.onExportData || (async () => { })} onImportData={props.onImportData} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex">
            <div className="md:hidden fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
                <button
                    className="bg-primary-600 text-white p-2 rounded-lg shadow-lg"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Menüyü Aç"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                {/* Remote notification center - mobilde */}
                {isParent && (
                    <RemoteNotificationCenter
                        notifications={notifications}
                        unreadCount={notifications.filter(n => !n.read).length}
                        onMarkAsRead={(id) => {/* Handle mark as read */ }}
                    />
                )}
            </div>

            {/* Desktop header - masaüstünde notification center */}
            <div className="hidden md:flex fixed top-4 right-4 z-50">
                {isParent && (
                    <RemoteNotificationCenter
                        notifications={notifications}
                        unreadCount={notifications.filter(n => !n.read).length}
                        onMarkAsRead={(id) => {/* Handle mark as read */ }}
                    />
                )}
            </div>

            {/* Drawer - mobilde açılır menü */}
            {
                drawerOpen && (
                    <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex">
                        <div className="w-64 bg-white p-4 space-y-2 h-full shadow-xl animate-slide-in-left relative">
                            <button
                                className="absolute top-3 right-3 text-slate-500 hover:text-primary-600 text-3xl font-light"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Menüyü Kapat"
                            >
                                &times;
                            </button>
                            {/* Kullanıcı bilgisi örnek */}
                            <div className="mb-4 flex items-center space-x-3">
                                <Settings className="w-7 h-7 text-primary-600" />
                                <span className="font-bold text-lg text-primary-700">Ebeveyn Paneli</span>
                            </div>
                            <NavLink view="dashboard" icon={<Home className="w-5 h-5" />} label="Genel Bakış" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="courses" icon={<BookOpen className="w-5 h-5" />} label="Dersler" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="tasks" icon={<ClipboardList className="w-5 h-5" />} label="Görevler" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="analytics" icon={<BarChartIcon className="w-5 h-5" />} label="Performans Analizi" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="exams" icon={<Brain className="w-5 h-5" />} label="Sınavlar" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="reading" icon={<BookMarked className="w-5 h-5" />} label="Kitap Okuma Analizi" onClick={() => setDrawerOpen(false)} />

                            <NavLink view="reports" icon={<FileText className="w-5 h-5" />} label="Raporlar" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="rewards" icon={<Gift className="w-5 h-5" />} label="Ödüller" onClick={() => setDrawerOpen(false)} />
                            <NavLink view="datamanagement" icon={<Settings className="w-5 h-5" />} label="Veri Yönetimi" onClick={() => setDrawerOpen(false)} />
                        </div>
                        {/* Drawer dışına tıklayınca kapansın */}
                        <div className="flex-1" onClick={() => setDrawerOpen(false)} />
                    </div>
                )
            }

            {/* Masaüstü menü - md ve üstü ekranlarda görünür */}
            <aside className="w-64 bg-white p-4 space-y-2 sticky top-[81px] h-[calc(100vh-81px)] shadow-sm hidden md:block">
                <div className="mb-4 flex items-center space-x-3">
                    <Settings className="w-7 h-7 text-primary-600" />
                    <span className="font-bold text-lg text-primary-700">Ebeveyn Paneli</span>
                </div>
                <NavLink view="dashboard" icon={<Home className="w-5 h-5" />} label="Genel Bakış" />
                <NavLink view="courses" icon={<BookOpen className="w-5 h-5" />} label="Dersler" />
                <NavLink view="tasks" icon={<ClipboardList className="w-5 h-5" />} label="Görevler" />
                <NavLink view="analytics" icon={<BarChartIcon className="w-5 h-5" />} label="Performans Analizi" />
                <NavLink view="exams" icon={<Brain className="w-5 h-5" />} label="Sınavlar" />
                <NavLink view="reading" icon={<BookMarked className="w-5 h-5" />} label="Kitap Okuma Analizi" />

                <NavLink view="reports" icon={<FileText className="w-5 h-5" />} label="Raporlar" />
                <NavLink view="rewards" icon={<Gift className="w-5 h-5" />} label="Ödüller" />
                <NavLink view="datamanagement" icon={<Settings className="w-5 h-5" />} label="Veri Yönetimi" />
            </aside>
            <div className="flex-1 p-8 bg-slate-50">
                {renderContent()}
            </div>
        </div>
    );
};

export default ParentDashboard;