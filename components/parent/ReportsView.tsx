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


const ReportsView: React.FC<{
    generateReport: (type: string, dateRange: string) => Promise<ReportData | null>;
    courses: Course[];
    tasks: Task[];
    timeFilter: TimeFilterValue;
    onTimeFilterChange: (value: TimeFilterValue) => void;
}> = ({ generateReport, courses, tasks, timeFilter, onTimeFilterChange }) => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const periodMap: Record<string, 'Haftalık' | 'Aylık' | 'Yıllık' | 'Tüm Zamanlar'> = {
                'week': 'Haftalık',
                'month': 'Aylık',
                'year': 'Yıllık',
                'all': 'Tüm Zamanlar',
                'day': 'Haftalık',
                'custom': 'Haftalık'
            };
            const mappedPeriod = periodMap[timeFilter.period] || 'Haftalık';
            const data = await generateReport('general', mappedPeriod);
            setReport(data);
        } catch (err) {
            setError('Rapor oluşturulurken bir hata oluştu.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!report) return;
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(report, null, 2)], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `rapor-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md no-print">
                <h3 className="text-xl font-bold mb-4">Rapor Oluştur</h3>
                <div className="flex items-center space-x-4 mb-4">
                    <TimeRangeFilter onFilterChange={onTimeFilterChange} />
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                    >
                        {isLoading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
                    </button>
                </div>
                {error && <p className="text-red-500">{error}</p>}
            </div>

            {report && (
                <div className="bg-white p-8 rounded-xl shadow-md print:shadow-none">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <h2 className="text-2xl font-bold">Performans Raporu</h2>
                        <div className="space-x-2">
                            <button onClick={handlePrint} className="text-slate-600 hover:text-primary-600"><Printer className="w-6 h-6" /></button>
                            <button onClick={handleDownload} className="text-slate-600 hover:text-primary-600"><Download className="w-6 h-6" /></button>
                        </div>
                    </div>

                    <div className="prose max-w-none">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">Özet</h3>
                            <p>{report.summary}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">Güçlü Yönler</h3>
                            <ul className="list-disc pl-5">
                                {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">Gelişim Alanları</h3>
                            <ul className="list-disc pl-5">
                                {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-2">Öneriler</h3>
                            <ul className="list-disc pl-5">
                                {report.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default ReportsView;
