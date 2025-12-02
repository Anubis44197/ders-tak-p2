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


const ExamManager: React.FC<{ 
    courses: Course[], 
    exams: Exam[], 
    tasks: Task[], 
    deleteExam: (id: string) => void,
    deleteTask: (id: string) => void 
}> = ({ courses, exams, tasks, deleteExam, deleteTask }) => {
    
    // Yeni sistem sınavları (tamamlanmış sınav görevleri)
    const examTasks = useMemo(() => {
        return tasks
            .filter(t => t.taskType === 'sınav' && t.status === 'tamamlandı')
            .sort((a, b) => new Date(b.completionDate || '').getTime() - new Date(a.completionDate || '').getTime());
    }, [tasks]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-purple-600" />
                    Sınav / Deneme Sonuçları
                </h3>
                <div className="text-sm text-slate-500">
                    Yeni sınav eklemek için "Görevler" sekmesini kullanın.
                </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Yeni Sistem Sınavları */}
                {examTasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-lg text-slate-800">{task.title}</h4>
                                <p className="text-sm text-slate-500 flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {new Date(task.completionDate || '').toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 px-3 py-1 rounded-lg">
                                    <span className="text-xs text-purple-600 font-bold block">TOPLAM NET</span>
                                    <span className="text-xl font-black text-purple-800">{task.totalNet?.toFixed(2) || '0.00'}</span>
                                </div>
                                <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Ders Bazlı Sonuçlar */}
                        {task.examResults && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                                {task.examResults.map(res => {
                                    const course = courses.find(c => c.id === res.courseId);
                                    return (
                                        <div key={res.courseId} className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                            <p className="text-xs font-bold text-slate-600 truncate">{course?.name}</p>
                                            <div className="flex justify-center space-x-2 text-xs mt-1">
                                                <span className="text-green-600 font-medium">{res.correct} D</span>
                                                <span className="text-red-500 font-medium">{res.incorrect} Y</span>
                                            </div>
                                            <p className="text-sm font-bold text-purple-700 mt-1">{res.net} Net</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {/* Eski Sistem Sınavları (Legacy) */}
                {exams.length > 0 && (
                    <>
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-sm text-slate-400">Geçmiş Kayıtlar</span>
                            </div>
                        </div>
                        {exams.map(exam => (
                            <div key={exam.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-75">
                                <div>
                                    <p className="font-bold text-slate-700">{exam.title}</p>
                                    <p className="text-xs text-slate-500">{exam.date}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-purple-600 font-bold text-lg">{exam.totalNet} Net</span>
                                    <button onClick={() => deleteExam(exam.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {examTasks.length === 0 && exams.length === 0 && (
                    <div className="text-center py-10">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500">Henüz sınav sonucu bulunmuyor.</p>
                        <p className="text-sm text-slate-400 mt-2">Çocuğunuza "Sınav" türünde görev atayarak başlayın!</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default ExamManager;
