import React, { useState, useMemo, useEffect } from 'react';
import { BarChart as BarChartIcon, BookOpen, ClipboardList, FileText, Home, PlusCircle, Trash2, TrendingUp, TrendingDown, CheckCircle, Clock, ListFilter, Brain, Zap, Gift, Printer, Download, ArrowUpDown, Trophy, Sparkles, BookMarked } from '../icons';
import { DailyBriefingData, PerformanceData, ReportData, Task, ParentDashboardProps, Course, Reward } from '../../types';
// Tree-shaking için ayrı ayrı import edildi
import { BarChart } from 'recharts/es6/chart/BarChart';
import { Bar } from 'recharts/es6/cartesian/Bar';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { Legend } from 'recharts/es6/component/Legend';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { LineChart } from 'recharts/es6/chart/LineChart';
import { Line } from 'recharts/es6/cartesian/Line';
import { AreaChart } from 'recharts/es6/chart/AreaChart';
import { Area } from 'recharts/es6/cartesian/Area';
import { GoogleGenAI, Type } from "@google/genai";
import EmptyState from '../shared/EmptyState';
// Statik importlar kaldırıldı - Sadece lazy loading

// ⚡ Lazy Loading Komponenleri - Bundle Size Optimizasyonu
const LazyReportsCourseTrends = React.lazy(() => import('./ReportsCourseTrends'));
const TaskTypeAnalysis = React.lazy(() => import('./TaskTypeAnalysis'));
const BestPeriodAnalysis = React.lazy(() => import('./BestPeriodAnalysis'));
const CompletionSpeedAnalysis = React.lazy(() => import('./CompletionSpeedAnalysis'));
const CourseTimeDistribution = React.lazy(() => import('./CourseTimeDistribution'));


const Modal: React.FC<{ show: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} aria-label="Kapat" title="Kapat" className="text-slate-500 hover:text-slate-800 text-3xl font-light">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className="bg-primary-100 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

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
                    const Icon = course.icon || BookOpen;
                    return (
                        <div key={course.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <Icon className="w-6 h-6 text-primary-600"/>
                                <span className="font-semibold">{course.name}</span>
                            </div>
                            <button onClick={() => deleteCourse(course.id)} className="text-red-500 hover:text-red-700" title="Dersi Sil" aria-label="Dersi Sil">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

const TaskManager: React.FC<{ tasks: Task[], courses: Course[], addTask: (task: Omit<Task, 'id' | 'status'>) => Task, deleteTask: (id: string) => void }> = ({ tasks, courses, addTask, deleteTask }) => {
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    // Açıklama kaldırıldı
    const [dueDate, setDueDate] = useState('');
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [taskType, setTaskType] = useState<'soru çözme' | 'ders çalışma' | 'kitap okuma'>('soru çözme');
    const [plannedDuration, setPlannedDuration] = useState<string>('');
    const [questionCount, setQuestionCount] = useState<number | ''>('');
    const [bookTitle, setBookTitle] = useState('');


    // Filtering and Sorting State
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'bekliyor' | 'tamamlandı'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredAndSortedTasks = useMemo(() => {
        let tempTasks = [...tasks];

        // Filtering
        if (filterCourse !== 'all') {
            tempTasks = tempTasks.filter(t => t.courseId === filterCourse);
        }
        if (filterStatus !== 'all') {
            tempTasks = tempTasks.filter(t => t.status === filterStatus);
        }

        // Sorting
        tempTasks.sort((a, b) => {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();
            // FIX: Corrected a typo in the sort comparison from `b` to `dateA`.
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return tempTasks;
    }, [tasks, filterCourse, filterStatus, sortOrder]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(title.trim() && dueDate && courseId && plannedDuration && Number(plannedDuration) > 0) {
            const taskData: Omit<Task, 'id' | 'status'> = { 
                title, 
                dueDate, 
                courseId, 
                taskType, 
                plannedDuration: Number(plannedDuration),
                ...(taskType === 'soru çözme' && { questionCount: Number(questionCount) }),
                ...(taskType === 'kitap okuma' && { bookTitle: bookTitle })
            };
            addTask(taskData);
            // UX Improvement: Clear form but keep modal open for rapid task entry.
            setTitle(''); setDueDate(''); setCourseId(courses[0]?.id || '');
            setTaskType('soru çözme'); setPlannedDuration(''); setQuestionCount(''); setBookTitle('');
        }
    };
    
    const formatSeconds = (seconds: number) => {
        if (seconds < 60) return `${seconds} sn`;
        return `${Math.round(seconds / 60)} dk`;
    }

    return (
         <div className="bg-white p-6 rounded-xl shadow-md">
             <Modal show={showModal} onClose={() => setShowModal(false)} title="Yeni Görev Ata">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">Görev Başlığı</label>
                    <input id="task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Görev Başlığı" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    <label htmlFor="task-course" className="block text-sm font-medium text-slate-700 mb-1">Ders Seç</label>
                    <select id="task-course" title="Ders Seç" value={courseId} onChange={e => setCourseId(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                     <label htmlFor="task-type" className="block text-sm font-medium text-slate-700 mb-1">Görev Türü</label>
                     <select id="task-type" title="Görev Türü" value={taskType} onChange={e => setTaskType(e.target.value as any)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="soru çözme">Soru Çözme</option>
                        <option value="ders çalışma">Ders Çalışma</option>
                        <option value="kitap okuma">Kitap Okuma</option>
                    </select>
                    {taskType === 'soru çözme' && (
                         <div>
                            <label htmlFor="task-question-count" className="block text-sm font-medium text-slate-700 mb-1">Soru Sayısı</label>
                            <input id="task-question-count" type="number" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} required min="1" placeholder="Soru Sayısı" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                        </div>
                    )}
                    {taskType === 'kitap okuma' && (
                         <div>
                            <label htmlFor="task-book-title" className="block text-sm font-medium text-slate-700 mb-1">Kitap Adı</label>
                            <input id="task-book-title" type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} required placeholder="Kitap Adı" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                        </div>
                    )}
                    <div>
                        <label htmlFor="task-duration" className="block text-sm font-medium text-slate-700 mb-1">Planlanan Süre (dk)</label>
                        <input id="task-duration" type="number" value={plannedDuration} onChange={e => setPlannedDuration(e.target.value === '' ? '' : e.target.value.replace(/^0+/, ''))} required placeholder="Süre (dk)" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" min="1"/>
                    </div>
                    <button type="submit" className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition" aria-label={courses.length === 0 ? "Görev atamak için önce bir ders eklemelisiniz." : "Görevi Ata"} title={courses.length === 0 ? "Görev atamak için önce bir ders eklemelisiniz." : "Görevi Ata"} disabled={courses.length === 0}>Görevi Ata</button>
                </form>
            </Modal>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Görev Yöneticisi</h3>
                                <button 
                                    aria-label={courses.length === 0 ? "Görev atamak için önce bir ders eklemelisiniz." : "Yeni Görev Ata"}
                    onClick={() => setShowModal(true)} 
                    disabled={courses.length === 0}
                    className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:bg-primary-300 disabled:cursor-not-allowed"
                    title={courses.length === 0 ? "Görev atamak için önce bir ders eklemelisiniz." : "Yeni Görev Ata"}
                >
                    <PlusCircle className="w-5 h-5 mr-2" /> Yeni Görev
                </button>
            </div>
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-slate-50 rounded-lg">
                <label htmlFor="filter-course" className="sr-only">Ders Filtrele</label>
                <select id="filter-course" title="Ders Filtrele" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="flex-grow bg-white border border-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="all">Tüm Dersler</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                 <label htmlFor="filter-status" className="sr-only">Durum Filtrele</label>
                 <select id="filter-status" title="Durum Filtrele" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="flex-grow bg-white border border-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="all">Tüm Durumlar</option>
                    <option value="bekliyor">Bekleyenler</option>
                    <option value="tamamlandı">Tamamlananlar</option>
                </select>
                <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="flex items-center bg-white border border-slate-300 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100" aria-label="Sırala" title="Sırala">
                    <ArrowUpDown className="w-4 h-4 mr-2"/>
                    {sortOrder === 'newest' ? 'En Yeni' : 'En Eski'}
                </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                 {filteredAndSortedTasks.length > 0 ? filteredAndSortedTasks.map(task => (
                    <div key={task.id} className="p-4 bg-slate-50 rounded-lg max-h-32 overflow-hidden hover:max-h-none hover:overflow-visible transition-all duration-300 cursor-pointer relative group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{task.title}</p>
                                <div className="flex items-center mt-1">
                                    <p className="text-sm text-slate-500">{courses.find(c=>c.id === task.courseId)?.name}</p>
                                    {task.isSelfAssigned && (
                                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Serbest Çalışma</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${task.status === 'tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                 {task.status === 'tamamlandı' ? 'Tamamlandı' : 'Bekliyor'}
                              </span>
                              <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700" title="Görevi Sil" aria-label="Görevi Sil">
                                  <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                            {task.status === 'tamamlandı' ? (
                                <div className="flex space-x-4 items-center">
                                    <span>Süre: <span className="font-semibold">{formatSeconds(task.actualDuration || 0)}</span></span>
                                    <span>Mola: <span className="font-semibold">{formatSeconds(task.breakTime || 0)}</span></span>
                                    <span className="text-amber-600 font-bold">+{task.pointsAwarded || 0} BP</span>
                                </div>
                            ) : (
                                <div className="flex space-x-4 items-center">
                                    <span>Plan: <span className="font-semibold">{task.plannedDuration} dk</span></span>
                                    {task.taskType === 'soru çözme' && <span>Soru: <span className="font-semibold">{task.questionCount}</span></span>}
                                </div>
                            )}

                        </div>
                        {task.status === 'tamamlandı' && task.startTimestamp && task.completionTimestamp && (
                            <div className="mt-1 text-xs text-slate-500 flex space-x-4">
                                <span>Başlangıç: {new Date(task.startTimestamp).toLocaleTimeString()}</span>
                                <span>Bitiş: {new Date(task.completionTimestamp).toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>
                )) : (
                     <div className="text-center py-10">
                         <p className="text-slate-500">Filtre kriterlerine uygun görev bulunmamaktadır.</p>
                    </div>
                )}
            </div>
         </div>
    );
};



const PerformanceAnalytics: React.FC<{ tasks: Task[], courses: Course[], ai: GoogleGenAI }> = ({ tasks, courses, ai }) => {
    type Period = 'Haftalık' | 'Aylık' | 'Yıllık' | 'Tüm Zamanlar';
    const [period, setPeriod] = useState<Period>('Haftalık');
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
    
    const [aiTopicAnalysis, setAiTopicAnalysis] = useState<any[] | null>(null);
    const [isAnalyzingTopics, setIsAnalyzingTopics] = useState(false);
    const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

    const filteredTasks = useMemo(() => {
        let days = 9999;
        if (period === 'Haftalık') days = 7;
        else if (period === 'Aylık') days = 30;
        else if (period === 'Yıllık') days = 365;
        // Tüm Zamanlar: 9999 gün
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - (days - 1));

        if (period === 'Tüm Zamanlar') {
            return tasks.filter(t => t.status === 'tamamlandı' && t.completionDate);
        }
        return tasks.filter(t =>
            t.status === 'tamamlandı' &&
            t.completionDate &&
            new Date(t.completionDate) >= cutoffDate
        );
    }, [tasks, period]);
    
    const handleAiTopicAnalysis = async () => {
        setIsAnalyzingTopics(true);
        setAiTopicAnalysis(null);
        setAiAnalysisError(null);
        
        const courseName = courses.find(c => c.id === selectedCourseId)?.name;
        const relevantTasks = tasks.filter(t => t.courseId === selectedCourseId && t.status === 'tamamlandı' && t.successScore);

        // This check is now mainly for the function logic, UI check is separate
        if (relevantTasks.length < 3) {
            setAiAnalysisError("Konu analizi için en az 3 tamamlanmış görev gereklidir.");
            setIsAnalyzingTopics(false);
            return;
        }

        const simplifiedTasks = relevantTasks.map(t => ({ title: t.title, description: t.description, successScore: t.successScore }));

        const prompt = `Bir ebeveyn için '${courseName}' dersindeki görevleri analiz ediyorsun. Aşağıdaki görev listesini incele. Her görevin başlığını ve açıklamasını kullanarak görevleri ortak alt konulara ayır (örn: 'Cebir', 'Geometri'). Her bir alt konu için ortalama 'successScore' değerini hesapla. Sonuçları JSON formatında bir dizi olarak döndür. Dizi, en yüksek puanlı konudan en düşük puanlıya doğru sıralanmalıdır. Görev listesi: ${JSON.stringify(simplifiedTasks)}`;
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                konu: { type: Type.STRING, description: 'Görevlerin gruplandırıldığı alt konunun adı.' },
                                ortalamaPuan: { type: Type.NUMBER, description: 'Bu konudaki görevlerin ortalama başarı puanı (0-100).' },
                                gorevSayisi: { type: Type.NUMBER, description: 'Bu konuya dahil edilen görev sayısı.'}
                            },
                             required: ['konu', 'ortalamaPuan', 'gorevSayisi']
                        }
                    },
                },
            });

            let result;
            try {
                result = JSON.parse(response.text);
            } catch (e) {
                setAiAnalysisError("Yapay zeka yanıtı beklenen formatta değil (JSON parse hatası).");
                setIsAnalyzingTopics(false);
                return;
            }
            // Validasyon: Dizi ve her elemanda konu:string, ortalamaPuan:number, gorevSayisi:number olmalı
            if (!Array.isArray(result) || result.some(item =>
                typeof item.konu !== 'string' ||
                typeof item.ortalamaPuan !== 'number' ||
                typeof item.gorevSayisi !== 'number' ||
                item.konu.trim() === '' ||
                item.ortalamaPuan < 0 || item.ortalamaPuan > 100 ||
                item.gorevSayisi < 1
            )) {
                setAiAnalysisError("Yapay zeka analizi beklenen formatta veri döndürmedi. Lütfen tekrar deneyin.");
                setIsAnalyzingTopics(false);
                return;
            }
            setAiTopicAnalysis(result);
        } catch (error) {
            console.error("AI topic analysis failed:", error);
            setAiAnalysisError("Yapay zeka analizi sırasında bir hata oluştu.");
        } finally {
            setIsAnalyzingTopics(false);
        }
    };


    const comparisonChartData = useMemo(() => {
        const courseMetrics: { [key: string]: { success: number[], focus: number[], count: number } } = {};
        
        const tasksToAnalyze = period === 'Tüm Zamanlar' ? tasks.filter(t => t.status === 'tamamlandı') : filteredTasks;

        tasksToAnalyze.forEach(task => {
            if (!courseMetrics[task.courseId]) {
                courseMetrics[task.courseId] = { success: [], focus: [], count: 0 };
            }
            if (task.successScore) courseMetrics[task.courseId].success.push(task.successScore);
            if (task.focusScore) courseMetrics[task.courseId].focus.push(task.focusScore);
            courseMetrics[task.courseId].count++;
        });

        return courses.map(course => {
            const metrics = courseMetrics[course.id];
            if (!metrics || metrics.count === 0) {
                return { name: course.name, "Başarı": 0, "Odaklanma": 0 };
            }
             // CRITICAL FIX: Prevent NaN by checking for array length before division
            const avgSuccess = metrics.success.length > 0 ? metrics.success.reduce((a, b) => a + b, 0) / metrics.success.length : 0;
            const avgFocus = metrics.focus.length > 0 ? metrics.focus.reduce((a, b) => a + b, 0) / metrics.focus.length : 0;


            return {
                name: course.name,
                "Başarı": Math.round(avgSuccess),
                "Odaklanma": Math.round(avgFocus),
            };
        });
    }, [filteredTasks, courses, period, tasks]);

    const tasksForSelectedCourse = useMemo(() => {
         return filteredTasks.filter(t => t.courseId === selectedCourseId)
            .sort((a,b) => new Date(a.completionDate || 0).getTime() - new Date(b.completionDate || 0).getTime());
    }, [filteredTasks, selectedCourseId]);

    const relevantTaskCountForAI = useMemo(() => {
        return tasks.filter(t => t.courseId === selectedCourseId && t.status === 'tamamlandı' && t.successScore).length;
    }, [tasks, selectedCourseId]);


    const PeriodButton: React.FC<{label: Period}> = ({label}) => (
        <button aria-label={label} title={label}
            onClick={() => setPeriod(label)}
            className={`px-6 py-2 rounded-lg font-semibold w-full transition ${period === label ? 'bg-primary-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200'}`}
        >
            {label}
        </button>
    );
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
                 <div className="space-y-2">
                    <h3 className="text-lg font-bold">Zaman Aralığı Seçin</h3>
                    <div className="flex space-x-2">
                        <PeriodButton label="Haftalık" />
                        <PeriodButton label="Aylık" />
                        <PeriodButton label="Yıllık" />
                        <PeriodButton label="Tüm Zamanlar" />
                    </div>
                 </div>
            </div>
            
            {/* Verimlilik Çizgi Grafiği */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4 flex items-center"><TrendingUp className="w-6 h-6 mr-2 text-blue-500" /> Günlük Verimlilik Grafiği</h3>
                                {/* Eksik puanlı görevler için uyarı */}
                                {tasks.some(t => t.status === 'tamamlandı' && (!Number.isFinite(t.successScore) || !Number.isFinite(t.focusScore))) && (
                                    <div className="mb-3 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold flex items-center">
                                        <span className="mr-2">⚠️</span>
                                        Bazı tamamlanmış görevlerde başarı veya odak puanı eksik. Bu görevler grafikte gösterilmeyecektir.
                                    </div>
                                )}
                {/* Günlük ortalama başarı ve odak puanı hesaplama */}
                {tasks.filter(t => t.status === 'tamamlandı').length === 0 ? (
                    <EmptyState 
                        icon={<TrendingUp className="w-8 h-8 text-slate-400"/>}
                        title="Verimlilik Grafiği İçin Veri Yok"
                        message="Çocuğunuz görevleri tamamladıkça, günlük başarı ve odak puanları burada çizgi grafik olarak görünecek."
                    />
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                            data={(() => {
                                // 1. Sadece tamamlanmış ve completionDate'i olan görevleri al
                                const completed = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate);
                                // 2. Tarihe göre gruplandır
                                const grouped = completed.reduce((acc, t) => {
                                    if (!t.completionDate) return acc;
                                    if (!acc[t.completionDate]) acc[t.completionDate] = [];
                                    acc[t.completionDate].push(t);
                                    return acc;
                                }, {} as Record<string, Task[]>);
                                // 3. Her gün için ortalama başarı ve odak puanı hesapla
                                return Object.entries(grouped)
                                    .map(([date, tasksForDay]) => {
                                        const dayTasks = tasksForDay as Task[];
                                        const validSuccess = dayTasks.filter(t => typeof t.successScore === 'number');
                                        const validFocus = dayTasks.filter(t => typeof t.focusScore === 'number');
                                        return {
                                            date,
                                            successScore: validSuccess.length > 0 ? Math.round(validSuccess.reduce((sum, t) => sum + (t.successScore || 0), 0) / validSuccess.length) : null,
                                            focusScore: validFocus.length > 0 ? Math.round(validFocus.reduce((sum, t) => sum + (t.focusScore || 0), 0) / validFocus.length) : null,
                                        };
                                    })
                                    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                            })()}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis domain={[0, 100]} unit="%" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="successScore" name="Başarı Puanı" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="focusScore" name="Odak Puanı" stroke="#f59e42" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Ders Karşılaştırması ({period})</h3>
                 {filteredTasks.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} unit="p" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Başarı" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Odaklanma" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <EmptyState 
                        icon={<BarChartIcon className="w-8 h-8 text-slate-400"/>}
                        title="Karşılaştırma İçin Veri Yok"
                        message="Seçtiğiniz zaman aralığında tamamlanmış görev bulunmamaktadır. Farklı bir dönem seçmeyi veya yeni görevler tamamlamayı bekleyin."
                    />
                 )}
             </div>
            
             <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Ders Detayı ({courses.find(c=>c.id === selectedCourseId)?.name})</h3>
                <select 
                    value={selectedCourseId} 
                    onChange={e => {
                        setSelectedCourseId(e.target.value)
                        setAiTopicAnalysis(null);
                        setAiAnalysisError(null);
                    }} 
                    className="w-full md:w-1/3 mb-4 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                    title="Ders seçimi"
                >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {tasksForSelectedCourse.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <div >
                        <h4 className="text-lg font-semibold mb-2 flex items-center"><Brain className="w-5 h-5 mr-2 text-blue-600"/> Başarı Puanı Gelişimi</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={tasksForSelectedCourse} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="completionDate" fontSize={12} />
                                <YAxis domain={[0, 100]} unit="p" />
                                <Tooltip />
                                <Line type="monotone" dataKey="successScore" name="Başarı" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold mb-2 flex items-center"><Zap className="w-5 h-5 mr-2 text-purple-600"/> Odaklanma Puanı Gelişimi</h4>
                        <ResponsiveContainer width="100%" height={300}>
                           <LineChart data={tasksForSelectedCourse} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="completionDate" fontSize={12} />
                                <YAxis domain={[0, 100]} unit="p"/>
                                <Tooltip />
                                <Line type="monotone" dataKey="focusScore" name="Odaklanma" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </div>
                 ) : (
                    <div className="py-10">
                         <EmptyState 
                            icon={<BookOpen className="w-8 h-8 text-slate-400"/>}
                            title="Bu Derse Ait Veri Yok"
                            message="Seçilen ders ve dönem için tamamlanmış görev bulunmamaktadır. Grafiklerin oluşması için görevlerin tamamlanması gerekmektedir."
                        />
                    </div>
                )}
                
                <div className="border-t pt-6">
                    <button
                        onClick={handleAiTopicAnalysis} 
                        disabled={isAnalyzingTopics || relevantTaskCountForAI < 3} 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        aria-label={relevantTaskCountForAI < 3 ? "Konu analizi için bu derse ait en az 3 tamamlanmış görev gereklidir." : "Konuları Analiz Et"}
                        title={relevantTaskCountForAI < 3 ? "Konu analizi için bu derse ait en az 3 tamamlanmış görev gereklidir." : "Konuları Analiz Et"}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {isAnalyzingTopics ? 'Analiz Ediliyor...' : 'Yapay Zeka ile Konuları Analiz Et'}
                    </button>
                    {isAnalyzingTopics && <p className="text-sm text-slate-500 mt-2">Bu işlem birkaç saniye sürebilir...</p>}
                    {aiAnalysisError && <p className="text-sm text-red-500 mt-2 font-semibold">{aiAnalysisError}</p>}
                    
                    {aiTopicAnalysis && (
                        <div className="mt-4">
                             <h4 className="text-lg font-semibold mb-2">Yapay Zeka Konu Analizi Sonuçları</h4>
                             <ResponsiveContainer width="100%" height={aiTopicAnalysis.length * 50}>
                                <BarChart data={aiTopicAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} unit="%" />
                                    <YAxis type="category" dataKey="konu" width={120} fontSize={12} />
                                    <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-white p-2 border rounded-lg shadow-sm text-sm">
                                                <p className="font-bold">{data.konu}</p>
                                                <p>Ort. Puan: <span className="font-semibold">{Math.round(data.ortalamaPuan)}</span></p>
                                                <p>Görev Sayısı: <span className="font-semibold">{data.gorevSayisi}</span></p>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}/>
                                    <Bar dataKey="ortalamaPuan" name="Ortalama Puan" fill="#10b981" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
             </div>

        </div>
    );
};


interface ReportsViewProps {
    generateReport: ParentDashboardProps['generateReport'];
    courses: Course[];
    tasks: Task[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ generateReport, courses, tasks }) => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [period, setPeriod] = useState<'Haftalık' | 'Aylık' | 'Yıllık' | 'Tüm Zamanlar'>('Haftalık');

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setReport(null);
        const result = await generateReport(period);
        setReport(result);
        setIsLoading(false);
    };

    const handleDownload = () => {
        if (!report) return;

        const content = `
${report.period} Performans Raporu (Yapay Zeka Analizi)
=====================================================

ÖZET
-----------------------------------------------------
${report.aiSummary}

ÖNE ÇIKANLAR
-----------------------------------------------------
- En Çok Gelişim Gösteren Ders: ${report.highlights.mostImproved}
- Odaklanılması Gereken Ders: ${report.highlights.needsFocus}

YAPAY ZEKA ÖNERİSİ
-----------------------------------------------------
${report.aiSuggestion}
        `;

        const blob = new Blob([content.trim()], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `performans-raporu-${report.period.toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        if (!report) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${report.period} Performans Raporu</title>
                    <style>
                        body { font-family: sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                        h1 { color: #1d4ed8; }
                        h2 { border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 30px; }
                        .section { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .highlight-good { border-left: 4px solid #10b981; padding: 10px; background-color: #f0fdf4; margin-bottom: 10px; }
                        .highlight-focus { border-left: 4px solid #f59e0b; padding: 10px; background-color: #fffbeb; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <h1>${report.period} Performans Raporu (Yapay Zeka Analizi)</h1>
                    
                    <h2>Genel Özet</h2>
                    <div class="section">
                        <p>${report.aiSummary}</p>
                    </div>

                    <h2>Öne Çıkanlar</h2>
                    <div class="highlight-good">
                        <strong>En Çok Gelişim Gösteren:</strong> ${report.highlights.mostImproved}
                    </div>
                    <div class="highlight-focus">
                        <strong>Odaklanılması Gereken:</strong> ${report.highlights.needsFocus}
                    </div>

                    <h2>Yapay Zeka Önerisi</h2>
                    <div class="section">
                         <p>${report.aiSuggestion}</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold mb-4">Yapay Zeka Raporları</h3>
                <p className="text-slate-600 mb-6">Çocuğunuzun performansını analiz etmek için yapay zeka destekli raporlar oluşturun. Rapor, son 7 veya 30 günlük tamamlanmış görev verilerini kullanır.</p>
             <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                 <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setPeriod('Haftalık')} className={`px-4 py-2 text-sm font-semibold rounded-md w-1/4 sm:w-auto transition ${period === 'Haftalık' ? 'bg-white shadow' : ''}`} aria-label="Haftalık" title="Haftalık">Haftalık</button>
                    <button onClick={() => setPeriod('Aylık')} className={`px-4 py-2 text-sm font-semibold rounded-md w-1/4 sm:w-auto transition ${period === 'Aylık' ? 'bg-white shadow' : ''}`} aria-label="Aylık" title="Aylık">Aylık</button>
                    <button onClick={() => setPeriod('Yıllık')} className={`px-4 py-2 text-sm font-semibold rounded-md w-1/4 sm:w-auto transition ${period === 'Yıllık' ? 'bg-white shadow' : ''}`} aria-label="Yıllık" title="Yıllık">Yıllık</button>
                    <button onClick={() => setPeriod('Tüm Zamanlar')} className={`px-4 py-2 text-sm font-semibold rounded-md w-1/4 sm:w-auto transition ${period === 'Tüm Zamanlar' ? 'bg-white shadow' : ''}`} aria-label="Tüm Zamanlar" title="Tüm Zamanlar">Tüm Zamanlar</button>
                </div>
                <button onClick={handleGenerateReport} disabled={isLoading} className="w-full sm:w-auto bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition flex items-center justify-center disabled:bg-primary-300" aria-label="Rapor Oluştur" title="Rapor Oluştur">
                    <Brain className="w-5 h-5 mr-2"/>
                    {isLoading ? 'Rapor Oluşturuluyor...' : `${period} Rapor Oluştur`}
                </button>
             </div>
            </div>

            {isLoading && (
                 <div className="bg-white p-6 rounded-xl shadow-md text-center">
                    <div className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                    </div>
                 </div>
            )}

            {!isLoading && report === null && (
                <div className="bg-white p-6 rounded-xl shadow-md text-center text-slate-600">
                    <div className="mb-2">Rapor oluşturulamadı veya yeterli veri yok.</div>
                    <div className="text-xs text-slate-400">Lütfen tamamlanmış görevleriniz olduğundan emin olun ve tekrar deneyin.</div>
                </div>
            )}

            {report && (
                <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in-up">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold">{report.period} Performans Raporu (Yapay Zeka Analizi)</h3>
                        <div className="flex space-x-2 flex-shrink-0">
                            <button onClick={handlePrint} className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition" aria-label="Yazdır" title="Yazdır">
                                <Printer className="w-4 h-4" />
                                <span>Yazdır</span>
                            </button>
                            <button onClick={handleDownload} className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition" aria-label="İndir" title="İndir">
                                <Download className="w-4 h-4" />
                                <span>İndir (.txt)</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-slate-600 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">{report.aiSummary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                                 <div>
                                    <h4 className="font-bold text-green-800">En Çok Gelişim Gösteren</h4>
                                    <p className="text-green-700">{report.highlights.mostImproved}</p>
                                </div>
                            </div>
                        </div>
                         <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                            <div className="flex items-center space-x-3">
                                <TrendingDown className="w-6 h-6 text-yellow-600" />
                                 <div>
                                    <h4 className="font-bold text-yellow-800">Odaklanılması Gereken</h4>
                                    <p className="text-yellow-700">{report.highlights.needsFocus}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-2 flex items-center"><Zap className="w-5 h-5 mr-2 text-primary-600"/> Yapay Zeka Önerisi</h4>
                        <p className="text-slate-700 p-4 bg-primary-50 border border-primary-200 rounded-lg">{report.aiSuggestion}</p>
                    </div>
                </div>
            )}
            {/* Kurs trend grafikleri: yalnızca rapor oluşturulmuşsa ve kurs/görev verisi varsa göster */}
            {report && courses && tasks && courses.length > 0 && tasks.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-4">Ders Bazında Performans Trendleri</h3>
                    <React.Suspense fallback={<div>Grafikler yükleniyor...</div>}>
                        {/** Dinamik import ile yükle (isteğe bağlı), burada doğrudan import edilebilir */}
                        {/* <ReportsCourseTrends tasks={tasks} courses={courses} period={period} /> */}
                                                <LazyReportsCourseTrends tasks={tasks} courses={courses} period={period} />
                    </React.Suspense>
                </div>
            )}
        </div>
    )
}

const CoursesDashboard: React.FC<ParentDashboardProps> = ({ courses, tasks, addCourse, deleteCourse }) => {
    const defaultIcon = BookOpen;
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id || null);
    const [isManageModalOpen, setManageModalOpen] = useState(false);

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
            successRate: `${successRate}%`,
            timeSpent: `${Math.round(totalTimeSeconds / 60)} dk`,
            completedCount: completedTasks.length.toString(),
            pendingCount: pendingTasks.length.toString()
        };
    }, [selectedCourse, completedTasks, pendingTasks]);

    const weeklyPerformanceData = useMemo(() => {
        const getWeek = (date: Date) => {
            const start = new Date(date.getFullYear(), 0, 1);
            const diff = (date.getTime() - start.getTime() + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000));
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor(diff / oneDay / 7) + 1;
        };

        const weeklyData: { [key: string]: { correct: number, incorrect: number } } = {};

        completedTasks.forEach(task => {
            if (task.completionDate) {
                const week = `Hafta ${getWeek(new Date(task.completionDate))}`;
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
        })).sort((a,b) => parseInt(a.week.split(' ')[1]) - parseInt(b.week.split(' ')[1]));
    }, [completedTasks]);

    const CourseTaskItem: React.FC<{task: Task}> = ({ task }) => (
        <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-bold">{task.title}</p>
            <div className="text-xs text-slate-500 mt-1 flex justify-between">

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
                    <ListFilter className="w-5 h-5"/>
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
                            <StatCard title="Genel Başarı" value={courseStats?.successRate || 'N/A'} icon={<TrendingUp className="w-6 h-6 text-primary-600"/>} />
                            <StatCard title="Toplam Süre" value={courseStats?.timeSpent || 'N/A'} icon={<Clock className="w-6 h-6 text-primary-600"/>} />
                            <StatCard title="Biten Görevler" value={courseStats?.completedCount || 'N/A'} icon={<CheckCircle className="w-6 h-6 text-primary-600"/>} />
                            <StatCard title="Bekleyen Görevler" value={courseStats?.pendingCount || 'N/A'} icon={<ClipboardList className="w-6 h-6 text-primary-600"/>} />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-bold mb-4">Haftalık Performans Gelişimi (%)</h3>
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
                                    icon={<BarChartIcon className="w-8 h-8 text-slate-400"/>}
                                    title="Performans Gelişimi İçin Veri Yok"
                                    message="Bu derste tamamlanmış görevler biriktikçe, haftalık başarı gelişimini gösteren grafik burada yer alacak."
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Bekleyen Görevler ({pendingTasks.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {pendingTasks.length > 0 ? pendingTasks.map(t => <CourseTaskItem key={t.id} task={t}/>) : <p className="text-slate-500">Bekleyen görev yok.</p>}
                                </div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold mb-4">Tamamlanan Görevler ({completedTasks.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {completedTasks.length > 0 ? completedTasks.map(t => <CourseTaskItem key={t.id} task={t}/>) : <p className="text-slate-500">Tamamlanmış görev yok.</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

const RewardsManager: React.FC<{rewards: Reward[], addReward: (reward: Omit<Reward, 'id'>) => void, deleteReward: (rewardId: string) => void}> = ({ rewards, addReward, deleteReward }) => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState<number | ''>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && cost !== '' && cost > 0) {
            addReward({ name, cost: Number(cost), icon: Gift });
            setName('');
            setCost('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-4">Ödülleri Yönet</h3>
             <form onSubmit={handleSubmit} className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-6 p-4 border border-slate-200 rounded-lg">
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ödül Adı (örn: Sinema Bileti)"
                    required
                    className="flex-grow border bg-white border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input 
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Puan Maliyeti"
                    required
                    min="1"
                    className="w-full md:w-40 border bg-white border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center" aria-label="Ödül Ekle" title="Ödül Ekle">
                    <PlusCircle className="w-5 h-5 mr-2" /> Ekle
                </button>
            </form>
            <div className="space-y-3">
                {rewards.map(reward => (
                    <div key={reward.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <reward.icon className="w-6 h-6 text-amber-500"/>
                            <span className="font-semibold">{reward.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="font-bold text-amber-600">{reward.cost} BP</span>
                            <button onClick={() => deleteReward(reward.id)} className="text-red-500 hover:text-red-700" aria-label="Ödülü Sil" title="Ödülü Sil">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const OverallSuccessChart: React.FC<{ tasks: Task[], courses: Course[] }> = ({ tasks, courses }) => {
    const completedTasks = tasks.filter(t => t.status === 'tamamlandı' && t.successScore !== undefined);

    const data = useMemo(() => {
        const courseSuccess: { [key: string]: { totalScore: number, count: number } } = {};

        completedTasks.forEach(task => {
            if (!courseSuccess[task.courseId]) {
                courseSuccess[task.courseId] = { totalScore: 0, count: 0 };
            }
            courseSuccess[task.courseId].totalScore += task.successScore!;
            courseSuccess[task.courseId].count++;
        });

        return courses.map(course => {
            const stats = courseSuccess[course.id];
            const avgSuccess = (stats && stats.count > 0) ? Math.round(stats.totalScore / stats.count) : 0;
            return { name: course.name, "Başarı Oranı": avgSuccess };
        }).sort((a, b) => b["Başarı Oranı"] - a["Başarı Oranı"]);
    }, [completedTasks, courses]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Derslere Göre Genel Başarı (%)</h3>
            {completedTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis type="category" dataKey="name" width={90} fontSize={12} />
                        <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} />
                        <Bar dataKey="Başarı Oranı" fill="#3b82f6" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                <EmptyState 
                    icon={<BarChartIcon className="w-8 h-8 text-slate-400"/>}
                    title="Genel Başarı İçin Veri Yok"
                    message="Henüz hiç görev tamamlanmadığı için ders başarı oranları hesaplanamadı."
                />
            )}
        </div>
    );
};

const PointsEarnedChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const completedTasks = tasks.filter(t => t.status === 'tamamlandı' && t.pointsAwarded);
    const data = useMemo(() => {
        const pointsByDay: { [key: string]: number } = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            pointsByDay[dateString] = 0;
        }

        const aMonthAgo = new Date(today);
        aMonthAgo.setDate(today.getDate() - 30);
        
        completedTasks.forEach(task => {
            if (task.completionDate && new Date(task.completionDate) > aMonthAgo) {
                const dateString = new Date(task.completionDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                pointsByDay[dateString] = (pointsByDay[dateString] || 0) + (task.pointsAwarded || 0);
            }
        });

        return Object.entries(pointsByDay).map(([date, points]) => ({ date, "Kazanılan Puan": points }));

    }, [completedTasks]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Kazanılan Puanlar (Son 30 Gün)</h3>
             {completedTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="Kazanılan Puan" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPoints)" />
                    </AreaChart>
                </ResponsiveContainer>
             ) : (
                 <EmptyState 
                    icon={<Trophy className="w-8 h-8 text-slate-400"/>}
                    title="Kazanılan Puanlar İçin Veri Yok"
                    message="Puan kazanım grafiğini görmek için görevlerin tamamlanması gerekmektedir."
                />
             )}
        </div>
    );
};

const DailyBriefing: React.FC<{ai: GoogleGenAI, tasks: Task[]}> = ({ ai, tasks }) => {
    const [briefing, setBriefing] = useState<DailyBriefingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateBriefing = async () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            const pendingTasks = tasks.filter(t => t.status === 'bekliyor');
            const todaysTasks = pendingTasks.slice(0, 5); // İlk 5 bekleyen görev
            const yesterdaysCompleted = tasks.filter(t => t.completionDate === yesterday);
            
            const prompt = `Bir ebeveyn için proaktif ve cesaretlendirici bir günlük özet hazırla.
            Bugünün bekleyen görevleri: ${todaysTasks.length} adet.
            Dün tamamlanan görevler: ${yesterdaysCompleted.length} adet.
            Dünkü görevlerin ortalama başarı puanı: ${yesterdaysCompleted.length > 0 ? Math.round(yesterdaysCompleted.reduce((acc, t) => acc + (t.successScore || 70), 0) / yesterdaysCompleted.length) : 'yok'}.
            
            Bu bilgilere dayanarak 'summary' ve 'suggestion' içeren bir JSON nesnesi oluştur.
            - summary: Bugünün durumunu pozitif bir dille özetle.
            - suggestion: Ebeveyne çocuğunu nasıl destekleyebileceğine dair kısa, eyleme geçirilebilir bir tavsiye ver.`;

            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [{
                        role: "user",
                        parts: [{ text: prompt }]
                    }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                summary: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                            },
                            required: ['summary', 'suggestion'],
                        },
                    },
                });
                setBriefing(JSON.parse(response.text));
            } catch (error) {
                console.error("Daily briefing generation failed:", error);
                setBriefing({
                    summary: "Günlük özet alınamadı.",
                    suggestion: "Lütfen daha sonra tekrar deneyin."
                });
            } finally {
                setIsLoading(false);
            }
        };

        generateBriefing();
    }, [tasks, ai]);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-500">
            <h3 className="text-xl font-bold mb-3 flex items-center"><Sparkles className="w-6 h-6 mr-2 text-primary-500"/> Günün Özeti</h3>
            <p className="text-slate-700 mb-4">{briefing?.summary}</p>
            <p className="text-sm text-slate-500 font-semibold p-3 bg-slate-50 rounded-lg">{briefing?.suggestion}</p>
        </div>
    );
};


const ParentDashboard: React.FC<ParentDashboardProps> = (props) => {
    function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
        const [value, setValue] = useState<T>(() => {
            try {
                const stickyValue = window.localStorage.getItem(key);
                return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
            } catch (error) {
                return defaultValue;
            }
        });
        useEffect(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch {}
        }, [key, value]);
        return [value, setValue];
    }

    const [activeView, setActiveView] = useStickyState<ParentView>('dashboard', 'parentActiveView');
  
  type ParentView = 'dashboard' | 'courses' | 'tasks' | 'analytics' | 'reports' | 'rewards';
  
    // ⚡ Performans optimizasyonu - Heavy calculations
    const performanceMetrics = useMemo(() => {
        const completedTasks = props.tasks.filter(t => t.status === 'tamamlandı');
        const totalPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
        const weeklyCompleted = completedTasks.filter(t => 
            t.completionDate && 
            new Date(t.completionDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        
        return { completedTasks, totalPoints, weeklyCompleted };
    }, [props.tasks]);

        const NavLink: React.FC<{ view: ParentView; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
            <button
                onClick={() => setActiveView(view)}
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeView === view ? 'bg-primary-600 text-white font-semibold shadow-lg' : 'text-slate-600 hover:bg-primary-100 hover:text-primary-700'
                }`}
                title={label}
                aria-label={label}
            >
                {icon}
                <span className="ml-3">{label}</span>
            </button>
    );

  const renderContent = () => {
            switch(activeView) {
                    case 'dashboard':
                            // ⚡ Optimize edilmiş metrikler kullanılıyor
                            return (
                                    <div className="space-y-8">
                                            <DailyBriefing ai={props.ai} tasks={props.tasks} />
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                <StatCard title="Aktif Ders Sayısı" value={props.courses.length.toString()} icon={<BookOpen className="w-6 h-6 text-primary-600"/>} />
                                                <StatCard title="Bekleyen Görevler" value={props.tasks.filter(t=> t.status === 'bekliyor').length.toString()} icon={<ClipboardList className="w-6 h-6 text-primary-600"/>} />
                                                <StatCard title="Tamamlanan Görevler (Haftalık)" value={performanceMetrics.weeklyCompleted.toString()} icon={<CheckCircle className="w-6 h-6 text-primary-600"/>} />
                                                <StatCard title="Toplam Başarı Puanı" value={performanceMetrics.totalPoints.toString()} icon={<Trophy className="w-6 h-6 text-amber-500"/>} />
                                        </div>
                                            {/* Görev Türü Analizi Kart+Grafik - Optimize Edilmiş */}
                                            <React.Suspense fallback={
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64">
                                                            <div className="bg-gray-300 h-4 rounded mb-4 w-1/2"></div>
                                                            <div className="bg-gray-200 h-48 rounded"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            }>
                                                <TaskTypeAnalysis tasks={props.tasks} />
                                                <BestPeriodAnalysis tasks={props.tasks} />
                                                <CompletionSpeedAnalysis tasks={props.tasks} />
                                                <CourseTimeDistribution tasks={props.tasks} courses={props.courses} />
                                            </React.Suspense>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                             <TaskManager {...props} />
                                             <div className="space-y-8">
                                                <OverallSuccessChart tasks={props.tasks} courses={props.courses}/>
                                                <PointsEarnedChart tasks={props.tasks} />
                                             </div>
                                        </div>
                                    </div>
                            );
          case 'courses': return <CoursesDashboard {...props} />;
          case 'tasks': return <TaskManager {...props} />;
          case 'analytics': return <PerformanceAnalytics tasks={props.tasks} courses={props.courses} ai={props.ai}/>;
          case 'reports': return <ReportsView generateReport={props.generateReport} courses={props.courses} tasks={props.tasks}/>;
          case 'rewards': return <RewardsManager rewards={props.rewards} addReward={props.addReward} deleteReward={props.deleteReward} />;
          default: return null;
      }
  }

  return (
    <div className="flex">
      <aside className="w-64 bg-white p-4 space-y-2 sticky top-[81px] h-[calc(100vh-81px)] shadow-sm">
        <NavLink view="dashboard" icon={<Home className="w-5 h-5"/>} label="Genel Bakış" />
        <NavLink view="courses" icon={<BookOpen className="w-5 h-5"/>} label="Dersler" />
        <NavLink view="tasks" icon={<ClipboardList className="w-5 h-5"/>} label="Görevler" />
        <NavLink view="analytics" icon={<BarChartIcon className="w-5 h-5"/>} label="Performans Analizi" />
        <NavLink view="reports" icon={<FileText className="w-5 h-5"/>} label="Raporlar" />
        <NavLink view="rewards" icon={<Gift className="w-5 h-5"/>} label="Ödüller" />
        
        {/* Storage Information */}
        {props.storageInfo && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>📁 Depolama:</span>
                <span className={`font-semibold ${parseFloat(props.storageInfo.usage.percentage) > 70 ? 'text-amber-600' : 'text-slate-700'}`}>
                  %{props.storageInfo.usage.percentage}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    parseFloat(props.storageInfo.usage.percentage) > 70 ? 'bg-amber-500' : 'bg-primary-500'
                  } ${
                    parseFloat(props.storageInfo.usage.percentage) <= 25 ? 'w-1/4' :
                    parseFloat(props.storageInfo.usage.percentage) <= 50 ? 'w-1/2' :
                    parseFloat(props.storageInfo.usage.percentage) <= 75 ? 'w-3/4' :
                    'w-full'
                  }`}
                />
              </div>
              <div className="text-xs text-slate-500">
                {props.storageInfo.usage.used}MB kullanılıyor
              </div>
              {props.storageInfo.archivedCount > 0 && (
                <div className="text-xs text-blue-600">
                  📚 {props.storageInfo.archivedCount} arşiv görev
                </div>
              )}
              {(props.storageInfo.showWarning || parseFloat(props.storageInfo.usage.percentage) > 50) && (
                <button
                  onClick={props.storageInfo.onArchive}
                  className={`w-full mt-2 px-2 py-1 text-xs rounded-lg transition ${
                    props.storageInfo.showWarning 
                      ? 'bg-amber-600 text-white hover:bg-amber-700 animate-pulse' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {props.storageInfo.showWarning ? '⚡ Arşivle!' : '📚 Arşiv Yap'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* API Key Information */}
        {props.apiKeyInfo && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>🔑 API:</span>
                <span className={`font-semibold ${props.apiKeyInfo.hasValidKey ? 'text-green-600' : 'text-red-600'}`}>
                  {props.apiKeyInfo.hasValidKey ? '✓ Aktif' : '⚠ Yok'}
                </span>
              </div>
              <button
                onClick={props.apiKeyInfo.onChangeKey}
                className={`w-full px-2 py-1 text-xs rounded-lg transition ${
                  props.apiKeyInfo.hasValidKey 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                }`}
              >
                {props.apiKeyInfo.hasValidKey ? '🔧 Değiştir' : '⚡ API Ekle'}
              </button>
            </div>
          </div>
        )}
      </aside>
      <div className="flex-1 p-8 bg-slate-50">
        {renderContent()}
      </div>
    </div>
  );
};

export default ParentDashboard;