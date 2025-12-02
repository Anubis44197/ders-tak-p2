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


const TaskManager: React.FC<{
    tasks: Task[],
    courses: Course[],
    addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<Task>,
    deleteTask: (id: string) => void,
    assignTask?: (task: Omit<Task, 'id' | 'assignedTo'>) => Promise<string | null>
}> = ({ tasks, courses, addTask, deleteTask, assignTask }) => {
    // Tek çocuklu kullanım, çoklu kullanıcıya gerek yok
    const [showModal, setShowModal] = useState(false);

    // Görev erteleme fonksiyonu
    const postponeTask = (taskId: string) => {
        // State güncellemesi için ana görevler dizisini güncelle
        if (typeof window !== 'undefined' && window.localStorage) {
            const tasksRaw = window.localStorage.getItem('tasks');
            let tasksArr: any[] = [];
            if (tasksRaw) {
                try { tasksArr = JSON.parse(tasksRaw); } catch { }
            }
            tasksArr = tasksArr.map(t => t.id === taskId ? { ...t, postponed: true } : t);
            window.localStorage.setItem('tasks', JSON.stringify(tasksArr));
        }
        // Eğer props ile setTasks fonksiyonu geliyorsa, burada çağrılabilir
        // Alternatif olarak, bir callback ile ana state güncellenebilir
        // Bu örnekte localStorage güncellendi, ana state güncellemesi App.tsx'de yapılmalı
        alert('Görev daha sonra yapılacak olarak işaretlendi.');
    };
    const [title, setTitle] = useState('');
    // Açıklama kaldırıldı
    const [dueDate, setDueDate] = useState('');
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [taskType, setTaskType] = useState<'soru çözme' | 'ders çalışma' | 'kitap okuma' | 'sınav'>('soru çözme');
    const [plannedDuration, setPlannedDuration] = useState<string>('');
    const [questionCount, setQuestionCount] = useState<number | ''>('');
    const [bookTitle, setBookTitle] = useState('');
    const [readingType, setReadingType] = useState<'ders' | 'serbest'>('ders');
    const [bookGenre, setBookGenre] = useState<'Hikaye' | 'Bilim' | 'Tarih' | 'Macera' | 'Şiir' | 'Diğer'>('Hikaye');
    const [assignmentType, setAssignmentType] = useState<'local' | 'remote'>('local');
    // Sınav için state'ler
    const [examCourses, setExamCourses] = useState<Array<{ courseId: string, questionCount: number }>>([]);
    // (Yukarıda tanımlandı, tekrar tanımlanmasına gerek yok)

    // Filtering and Sorting State
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'bekliyor' | 'tamamlandı'>('all');
    const [filterAssignment, setFilterAssignment] = useState<'all' | 'local' | 'remote'>('all');
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
        if (filterAssignment !== 'all') {
            tempTasks = tempTasks.filter(t => {
                const isRemote = t.assignedTo !== undefined && t.assignedTo !== null;
                return filterAssignment === 'remote' ? isRemote : !isRemote;
            });
        }

        // Sorting
        tempTasks.sort((a, b) => {
            const dateA = new Date(a.dueDate).getTime();
            const dateB = new Date(b.dueDate).getTime();
            // FIX: Corrected a typo in the sort comparison from `b` to `dateA`.
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return tempTasks;
    }, [tasks, filterCourse, filterStatus, filterAssignment, sortOrder]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isFreeReading = taskType === 'kitap okuma' && readingType === 'serbest';
        const isExam = taskType === 'sınav';
        const isValidCourse = isFreeReading || isExam || courseId; // Serbest okuma ve sınavda courseId zorunlu değil
        const isValidExam = !isExam || (isExam && examCourses.length > 0); // Sınavda en az 1 ders seçili olmalı
        
        if (title.trim() && dueDate && isValidCourse && plannedDuration && Number(plannedDuration) > 0 && isValidExam) {
            const taskData: Omit<Task, 'id' | 'status'> = {
                title,
                dueDate,
                courseId: (taskType === 'kitap okuma' && readingType === 'serbest') ? 'serbest-okuma' : courseId,
                taskType,
                plannedDuration: Number(plannedDuration),
                ...(taskType === 'soru çözme' && { questionCount: Number(questionCount) }),
                ...(taskType === 'kitap okuma' && { bookTitle: bookTitle, readingType: readingType, bookGenre: bookGenre }),
                ...(taskType === 'sınav' && { 
                    examConfig: { courses: examCourses },
                    courseId: 'exam-multi'  // Sınavlar için özel courseId
                }),
                // assignedTo field - remote görevler için doldurulacak
                ...(assignmentType === 'remote' && { assignedTo: 'child_user' })
            };

            try {
                if (assignmentType === 'remote' && assignTask) {
                    // Uzaktan görev atama - type uyumsuzluğunu çöz
                    const remoteTaskData = { ...taskData, status: 'bekliyor' as const };
                    const remoteTaskId = await assignTask(remoteTaskData);
                    if (remoteTaskId) {
                        alert('Görev başarıyla uzaktan atandı!');
                    } else {
                        alert('Uzaktan görev atama başarısız oldu. Yerel olarak ekleniyor...');
                        await addTask(taskData);
                    }
                } else {
                    // Yerel görev ekleme
                    await addTask(taskData);
                }
            } catch (error) {
                console.error('Görev ekleme hatası:', error);
                alert('Görev ekleme başarısız oldu.');
            }

            // UX Improvement: Clear form completely for consistent UX
            setTitle('');
            setDueDate('');
            setCourseId(courses[0]?.id || '');
            setTaskType('soru çözme');
            setPlannedDuration('');
            setQuestionCount('');
            setBookTitle('');
            setReadingType('ders');
            setBookGenre('Hikaye');
            setAssignmentType('local');
            setExamCourses([]);  // Sınav konfigürasyonunu temizle
            // Close modal after successful task creation
            setShowModal(false);
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
                    {/* Assignment Type Selection */}
                    {assignTask && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-slate-700 mb-3">Görev Atama Türü</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="assignmentType"
                                        value="local"
                                        checked={assignmentType === 'local'}
                                        onChange={(e) => setAssignmentType(e.target.value as 'local' | 'remote')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-slate-700">Yerel Görev</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="assignmentType"
                                        value="remote"
                                        checked={assignmentType === 'remote'}
                                        onChange={(e) => setAssignmentType(e.target.value as 'local' | 'remote')}
                                        className="mr-2"
                                    />
                                    <div className="flex items-center">
                                        <span className="text-sm text-slate-700">Uzaktan Atama</span>
                                        <Send className="w-4 h-4 ml-1 text-blue-500" />
                                    </div>
                                </label>
                            </div>
                            {assignmentType === 'remote' && (
                                <p className="text-xs text-blue-600 mt-2">
                                    Bu görev çocuğunuzun cihazına gerçek zamanlı olarak gönderilecek
                                </p>
                            )}
                        </div>
                    )}

                    <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">Görev Başlığı</label>
                    <input id="task-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Görev Başlığı" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <label htmlFor="task-due-date" className="block text-sm font-medium text-slate-700 mb-1">Son Teslim Tarihi</label>
                    <input id="task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {!(taskType === 'kitap okuma' && readingType === 'serbest') && (
                        <div>
                            <label htmlFor="task-course" className="block text-sm font-medium text-slate-700 mb-1">Ders Seç</label>
                            <select id="task-course" title="Ders Seç" value={courseId} onChange={e => setCourseId(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <label htmlFor="task-type" className="block text-sm font-medium text-slate-700 mb-1">Görev Türü</label>
                    <div className="flex items-center">
                        <select id="task-type" title="Görev Türü" value={taskType} onChange={e => setTaskType(e.target.value as any)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="soru çözme">Soru Çözme</option>
                            <option value="ders çalışma">Ders Çalışma</option>
                            <option value="kitap okuma">Kitap Okuma</option>
                            <option value="sınav">Sınav / Deneme</option>
                        </select>
                        <div className="ml-2 group relative">
                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Çocuğunuz için hangi tür görev oluşturmak istiyorsunuz?
                            </div>
                        </div>
                    </div>
                    {taskType === 'soru çözme' && (
                        <div>
                            <label htmlFor="task-question-count" className="block text-sm font-medium text-slate-700 mb-1">Soru Sayısı</label>
                            <input id="task-question-count" type="number" value={questionCount || ''} onChange={e => setQuestionCount(e.target.value === '' ? '' : Number(e.target.value))} required min="1" placeholder="Soru Sayısı" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    )}
                    {taskType === 'kitap okuma' && (
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="task-reading-type" className="block text-sm font-medium text-slate-700 mb-1">Okuma Türü</label>
                                <select
                                    id="task-reading-type"
                                    value={readingType}
                                    onChange={e => setReadingType(e.target.value as 'ders' | 'serbest')}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="ders">Ders Okuması</option>
                                    <option value="serbest">Serbest Okuma</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="task-book-genre" className="block text-sm font-medium text-slate-700 mb-1">Kitap Türü</label>
                                <select
                                    id="task-book-genre"
                                    value={bookGenre}
                                    onChange={e => setBookGenre(e.target.value as any)}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="Hikaye">Hikaye</option>
                                    <option value="Bilim">Bilim</option>
                                    <option value="Tarih">Tarih</option>
                                    <option value="Macera">Macera</option>
                                    <option value="Şiir">Şiir</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="task-book-title" className="block text-sm font-medium text-slate-700 mb-1">Kitap Adı</label>
                                <input id="task-book-title" type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} required placeholder="Kitap Adı" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>
                    )}
                    {taskType === 'sınav' && (
                        <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <div className="flex items-center space-x-2 mb-3">
                                <Brain className="w-5 h-5 text-purple-600" />
                                <h4 className="font-bold text-purple-900">Sınav Yapılandırması</h4>
                            </div>
                            <p className="text-sm text-purple-700 mb-3">Her ders için soru sayısını belirleyin:</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {courses.map((course, idx) => {
                                    const examCourse = examCourses.find(ec => ec.courseId === course.id);
                                    return (
                                        <div key={course.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                            <label className="font-medium text-slate-700">{course.name}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Soru sayısı"
                                                value={examCourse?.questionCount || ''}
                                                onChange={e => {
                                                    const count = Number(e.target.value);
                                                    setExamCourses(prev => {
                                                        const filtered = prev.filter(ec => ec.courseId !== course.id);
                                                        if (count > 0) {
                                                            return [...filtered, { courseId: course.id, questionCount: count }];
                                                        }
                                                        return filtered;
                                                    });
                                                }}
                                                className="w-24 border border-slate-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            {examCourses.length === 0 && (
                                <p className="text-sm text-red-600 mt-2">⚠️ En az bir ders için soru sayısı girmelisiniz!</p>
                            )}
                        </div>
                    )}
                    <div>
                        <label htmlFor="task-duration" className="block text-sm font-medium text-slate-700 mb-1">Planlanan Süre (dk)</label>
                        <input id="task-duration" type="number" value={plannedDuration} onChange={e => setPlannedDuration(e.target.value === '' ? '' : e.target.value.replace(/^0+/, ''))} required placeholder="Süre (dk)" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" min="1" />
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
                <label htmlFor="filter-assignment" className="sr-only">Atama Türü Filtrele</label>
                <select id="filter-assignment" title="Atama Türü" value={filterAssignment} onChange={e => setFilterAssignment(e.target.value as any)} className="flex-grow bg-white border border-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="all">Tüm Görevler</option>
                    <option value="local">Yerel Görevler</option>
                    <option value="remote">Uzaktan Atanan</option>
                </select>
                <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="flex items-center bg-white border border-slate-300 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100" aria-label="Sırala" title="Sırala">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    {sortOrder === 'newest' ? 'En Yeni' : 'En Eski'}
                </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAndSortedTasks.length > 0 ? filteredAndSortedTasks.map(task => (
                    <div key={task.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{task.title}</p>
                                <div className="flex items-center mt-1">
                                    <p className="text-sm text-slate-500">{courses.find(c => c.id === task.courseId)?.name}</p>
                                    {task.isSelfAssigned && (
                                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Serbest Çalışma</span>
                                    )}
                                    {task.assignedTo && (
                                        <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center">
                                            <Send className="w-3 h-3 mr-1" />
                                            Uzaktan Atanan
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${task.status === 'tamamlandı' ? 'bg-green-100 text-green-700' : task.postponed ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {task.status === 'tamamlandı' ? 'Tamamlandı' : task.postponed ? 'Daha Sonra Yapılacak' : 'Bekliyor'}
                                </span>
                                {!task.postponed && task.status !== 'tamamlandı' && (
                                    <button onClick={() => postponeTask(task.id)}
                                        className="text-blue-500 hover:text-blue-700" title="Daha Sonra Yap" aria-label="Daha Sonra Yap">
                                        <Clock className="w-5 h-5" />
                                    </button>
                                )}
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
                            <span>Tarih: <span className="font-semibold">{task.dueDate}</span></span>
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


export default TaskManager;
