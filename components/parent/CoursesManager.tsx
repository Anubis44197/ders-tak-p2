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


const CoursesManager: React.FC<{ courses: Course[], addCourse: (name: string) => void, deleteCourse: (id: string) => void }> = ({ courses, addCourse, deleteCourse }) => {
    const [courseName, setCourseName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (courseName.trim()) {
            addCourse(courseName.trim());
            setCourseName('');
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Ders Adı (örn: Tarih)"
                    className="flex-grow border bg-white border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center" aria-label="Ders Ekle" title="Ders Ekle">
                    <PlusCircle className="w-5 h-5 mr-2" /> Ekle
                </button>
            </form>
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {courses.map(course => {
                    let IconComponent: React.ComponentType<{ className?: string }> = Gift; // Varsayılan ikon
                    if (typeof course.icon === 'string') {
                        IconComponent = getIconComponent(course.icon);
                    } else if (typeof course.icon === 'function') {
                        IconComponent = course.icon as React.ComponentType<{ className?: string }>;
                    }
                    return (
                        <div key={course.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <IconComponent className="w-6 h-6 text-primary-600" />
                                <span className="font-semibold">{course.name}</span>
                            </div>
                            <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700 flex items-center space-x-1" title="Bu dersi ve tüm görevlerini kalıcı olarak sil" aria-label={`${course.name} dersini sil`}>
                                <Trash2 className="w-5 h-5" />
                                <span className="sr-only">Sil</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}


export default CoursesManager;
