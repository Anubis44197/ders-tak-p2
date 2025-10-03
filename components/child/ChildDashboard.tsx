// Yüzdeye göre genişlik class'ı döndür
function getProgressWidthClass(percent: number) {
    if (percent >= 100) return 'w-full';
    if (percent >= 90) return 'w-[90%]';
    if (percent >= 80) return 'w-[80%]';
    if (percent >= 70) return 'w-[70%]';
    if (percent >= 60) return 'w-[60%]';
    if (percent >= 50) return 'w-[50%]';
    if (percent >= 40) return 'w-[40%]';
    if (percent >= 30) return 'w-[30%]';
    if (percent >= 20) return 'w-[20%]';
    if (percent >= 10) return 'w-[10%]';
    return 'w-0';
}
import React, { useState, useEffect, useMemo } from 'react';
import { ChildDashboardProps, Task, Reward, Badge } from '../../types';
import { BarChart as RechartsBarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle, Clock, PlusCircle, Target, Play, Pause, Coffee, StopCircle, Trophy, Gift, BadgeCheck, BarChart, Calendar, BookOpen, BookMarked, Zap, Trash2 } from '../icons';
import ActiveReadingSession from './ActiveReadingSession';
import ActiveTaskTimer from './ActiveTaskTimer';
import './progress-bar.css';

const Modal: React.FC<{ show: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} aria-label="Kapat" title="Kapat" className="text-slate-500 hover:text-slate-800 text-3xl font-light">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

interface TimerState {
    mainTime: number;
    breakTime: number;
    pauseTime: number;
    status: 'running' | 'paused' | 'break';
}

const TaskCard: React.FC<{ task: Task, courses: ChildDashboardProps['courses'], onStart: (task: Task) => void }> = ({ task, courses, onStart }) => {
    const course = courses.find(c => c.id === task.courseId);
    const isReadingTask = task.taskType === 'kitap okuma';
    const isSelfAssigned = task.isSelfAssigned;
    const borderColor = isSelfAssigned ? 'border-indigo-500' : isReadingTask ? 'border-teal-500' : 'border-primary-500';
    const iconColor = isSelfAssigned ? 'text-indigo-600' : isReadingTask ? 'text-teal-600' : 'text-primary-600';
    const textColor = isSelfAssigned ? 'text-indigo-700' : isReadingTask ? 'text-teal-700' : 'text-primary-700';
    const Icon = isSelfAssigned ? Zap : isReadingTask ? BookMarked : course?.icon || BookOpen;

    return (
        <div className={`bg-white p-4 rounded-xl shadow-md border-l-4 ${borderColor} ${task.status === 'tamamlandı' ? 'bg-slate-50' : 'hover:shadow-lg transition-shadow'} max-w-md w-full mx-auto max-h-40 overflow-hidden hover:max-h-none transition-all duration-300`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                        <span className={`text-sm font-semibold ${textColor}`}>{isSelfAssigned ? 'Serbest Çalışma' : isReadingTask ? 'Kitap Okuma' : course?.name}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">{isReadingTask ? task.bookTitle : task.title}</h4>
                    {/* Açıklama satırı kaldırıldı */}
                </div>
                {task.status === 'tamamlandı' ? 
                    <div className="flex-shrink-0 ml-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    : null
                }
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
                 {task.status === 'tamamlandı' ? (
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-bold text-blue-700">{task.successScore}%</span>
                            </div>
                            <div className="progress-bar" aria-label="Başarı yüzdesi">
                                <div className={`progress-bar-inner progress-bar-blue ${getProgressWidthClass(task.successScore || 0)}`} aria-hidden="true"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-bold text-purple-700">{task.focusScore}%</span>
                            </div>
                            <div className="progress-bar" aria-label="Odak yüzdesi">
                                <div className={`progress-bar-inner progress-bar-purple ${getProgressWidthClass(task.focusScore || 0)}`} aria-hidden="true"></div>
                            </div>
                        </div>
                        {task.startTimestamp && task.completionTimestamp && (
                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                <span>Başlangıç: {new Date(task.startTimestamp).toLocaleTimeString()}</span>
                                <span>Bitiş: {new Date(task.completionTimestamp).toLocaleTimeString()}</span>
                            </div>
                        )}
                         <div className="text-right pt-2">
                            <span className="text-lg font-bold text-amber-600">+{task.pointsAwarded || 0} BP</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <div className="text-xs text-slate-500 font-medium flex space-x-4">
                            <span>{task.dueDate}</span>
                            <span>{task.plannedDuration} dk</span>
                            {task.taskType === 'soru çözme' && <span>{task.questionCount}</span>}
                        </div>
                        <button onClick={() => onStart(task)} className="bg-primary-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-primary-700 transition font-semibold flex items-center">
                            <Play className="w-4 h-4 mr-2"/> Görevi Başlat
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

const RewardStore: React.FC<{rewards: Reward[], successPoints: number, claimReward: (id: string) => void}> = ({ rewards, successPoints, claimReward }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center"><Gift className="w-6 h-6 mr-2 text-amber-500"/> Ödül Mağazası</h3>
        <div className="space-y-3">
            {rewards.map(reward => {
                const canAfford = successPoints >= reward.cost;
                return (
                    <div key={reward.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-semibold">{reward.name}</p>
                            <p className="text-sm font-bold text-amber-600">{reward.cost} BP</p>
                        </div>
                        <button
                            onClick={() => claimReward(reward.id)}
                            disabled={!canAfford}
                            className={`px-3 py-1 text-sm font-semibold rounded-lg transition ${
                                canAfford 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            Talep Et
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
);

const MyAchievements: React.FC<{badges: Badge[]}> = ({ badges }) => (
     <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center"><BadgeCheck className="w-6 h-6 mr-2 text-blue-500"/> Başarılarım</h3>
        <div className="flex flex-wrap gap-4">
            {badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center text-center p-2" title={badge.description}>
                    <badge.icon className="w-12 h-12 text-blue-500" />
                    <p className="text-xs font-semibold mt-1">{badge.name}</p>
                </div>
            ))}
        </div>
    </div>
)

const ReadingLog: React.FC<{ tasks: Task[], onClose: () => void }> = ({ tasks, onClose }) => {
    const readingTasks = useMemo(() => 
        tasks.filter(t => t.taskType === 'kitap okuma' && t.status === 'tamamlandı')
             .sort((a,b) => (b.completionTimestamp || 0) - (a.completionTimestamp || 0)),
        [tasks]
    );

    const weeklyChartData = useMemo(() => {
        const data: { name: string, pages: number }[] = [];
        const today = new Date();
        const dayNames = ['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];

            const pagesForDay = readingTasks
                .filter(task => task.completionDate === dateString)
                .reduce((total, task) => total + (task.pagesRead || 0), 0);
            
            data.push({ name: dayName, pages: pagesForDay });
        }
        return data;
    }, [readingTasks]);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold mb-2">Haftalık Okuma Aktivitesi (Sayfa Sayısı)</h4>
                 <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={weeklyChartData}>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="pages" name="Okunan Sayfa" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
            <div>
                 <h4 className="font-bold mb-2">Tüm Okuma Seansları</h4>
                 <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {readingTasks.length > 0 ? readingTasks.map(task => (
                        <div key={task.id} className="p-3 bg-slate-100 rounded-lg text-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold">{task.bookTitle}</span>
                                    <span className="text-slate-500 ml-2">({task.completionDate})</span>
                                </div>
                                <div className="font-bold text-teal-600">
                                    {task.pagesRead} Sayfa
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-slate-500">Okuma seansı bulunamadı.</p>}
                 </div>
            </div>
        </div>
    );
};

const MyLibrary: React.FC<{tasks: Task[]}> = ({ tasks }) => {
    const [isLogVisible, setLogVisible] = useState(false);
    const library = useMemo(() => {
        const books: { [key: string]: { totalPages: number, title: string } } = {};
        const readingTasks = tasks.filter(t => t.taskType === 'kitap okuma' && t.status === 'tamamlandı' && t.bookTitle);
        
        readingTasks.forEach(task => {
            if (!books[task.bookTitle!]) {
                books[task.bookTitle!] = { totalPages: 0, title: task.bookTitle! };
            }
            books[task.bookTitle!].totalPages += task.pagesRead || 0;
        });

        return Object.values(books).sort((a,b) => b.totalPages - a.totalPages);
    }, [tasks]);

    return (
        <>
            <Modal show={isLogVisible} onClose={() => setLogVisible(false)} title="Okuma Günlüğüm">
                <ReadingLog tasks={tasks} onClose={() => setLogVisible(false)} />
            </Modal>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center"><BookMarked className="w-6 h-6 mr-2 text-teal-500"/> Kütüphanem</h3>
                    <button onClick={() => setLogVisible(true)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">Detayları Gör</button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {library.length > 0 ? library.map(book => (
                        <div key={book.title} className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-bold text-slate-800">{book.title}</p>
                            <div className="flex items-center mt-1">
                                <div className="progress-bar mr-2">
                                    <div className="progress-bar-inner progress-bar-teal w-full" aria-hidden="true"></div>
                                </div>
                                <span className="text-sm font-semibold text-teal-600">{book.totalPages} sayfa</span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500 text-center py-4">Henüz hiç kitap okuma görevi tamamlamadın.</p>
                    )}
                </div>
            </div>
        </>
    );
}


const WeeklyPointsChart: React.FC<{tasks: Task[]}> = ({ tasks }) => {
    const weeklyData = useMemo(() => {
        const data: { name: string, points: number }[] = [];
        const today = new Date();
        const dayNames = ['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];

            const pointsForDay = tasks
                .filter(task => task.completionDate === dateString)
                .reduce((total, task) => total + (task.pointsAwarded || 0), 0);
            
            data.push({ name: dayName, points: pointsForDay });
        }
        return data;
    }, [tasks]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center"><BarChart className="w-6 h-6 mr-2 text-green-500"/> Haftalık Puanlarım</h3>
            <ResponsiveContainer width="100%" height={200}>
                <RechartsBarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: 'rgba(59, 130, 246, 0.1)'}}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded-lg shadow-sm">
                                <p className="text-sm font-bold">{`${label}: ${payload[0].value} BP`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                    />
                    <Bar dataKey="points" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}

type TaskFilter = 'all' | 'today' | 'upcoming';
type ChildView = 'tasks' | 'treasures';

const ChildDashboard: React.FC<ChildDashboardProps> = (props) => {
    const { tasks, courses, rewards, badges, successPoints, startTask, completeTask, claimReward, addTask } = props;
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [activeReadingTask, setActiveReadingTask] = useState<Task | null>(null);
    const [persistedTimerState, setPersistedTimerState] = useState<TimerState | undefined>(undefined);
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('today');
    const [isFreeStudyModalOpen, setIsFreeStudyModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<ChildView>('tasks');
    
    // State for handling unfinished sessions
    const [unfinishedSessionTask, setUnfinishedSessionTask] = useState<Task | null>(null);
    const [showUnfinishedSessionModal, setShowUnfinishedSessionModal] = useState(false);


    // Free Study Modal State
    const [freeStudyTitle, setFreeStudyTitle] = useState('');
    const [freeStudyCourseId, setFreeStudyCourseId] = useState(courses[0]?.id || '');
    const [freeStudyDuration, setFreeStudyDuration] = useState(30);

    const handleStartTask = (task: Task) => {
        startTask(task.id);
        if (task.taskType === 'kitap okuma') {
            setActiveReadingTask(task);
        } else {
            setActiveTask(task);
        }
    };

    const handleStartFreeStudy = (e: React.FormEvent) => {
        e.preventDefault();
        if (freeStudyTitle.trim() && freeStudyCourseId && freeStudyDuration > 0) {
            const today = new Date().toISOString().split('T')[0];
            const newTask = addTask({
                title: freeStudyTitle,
                courseId: freeStudyCourseId,
                dueDate: today,
                taskType: 'ders çalışma',
                plannedDuration: freeStudyDuration,
                isSelfAssigned: true
            });
            // UX Improvement: Immediately start the created task
            handleStartTask(newTask);
            setIsFreeStudyModalOpen(false);
            setFreeStudyTitle('');
            setFreeStudyDuration(30);
            setFreeStudyCourseId(courses[0]?.id || '');
        }
    };

    // Check for unfinished sessions on initial load
    useEffect(() => {
        for (const task of tasks) {
            if (task.status === 'bekliyor') {
                const savedState = localStorage.getItem(`timerState_${task.id}`);
                if (savedState) {
                    try {
                        const parsedState = JSON.parse(savedState);
                        setPersistedTimerState(parsedState);
                        setUnfinishedSessionTask(task);
                        setShowUnfinishedSessionModal(true);
                        // Stop checking after finding the first unfinished session
                        return;
                    } catch (e) {
                        console.error("Failed to parse saved timer state", e);
                        localStorage.removeItem(`timerState_${task.id}`);
                    }
                }
            }
        }
    }, []); // Run only once on component mount

    const handleContinueSession = () => {
        if (unfinishedSessionTask) {
            handleStartTask(unfinishedSessionTask);
            setShowUnfinishedSessionModal(false);
            setUnfinishedSessionTask(null);
        }
    };

    const handleDiscardSession = () => {
        if (unfinishedSessionTask) {
            localStorage.removeItem(`timerState_${unfinishedSessionTask.id}`);
            setShowUnfinishedSessionModal(false);
            setUnfinishedSessionTask(null);
            setPersistedTimerState(undefined);
        }
    };

    const allPendingTasks = useMemo(() => 
        tasks.filter(t => t.status === 'bekliyor').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), 
    [tasks]);

    const filteredPendingTasks = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (taskFilter === 'today') {
            return allPendingTasks.filter(t => {
                const taskDate = new Date(t.dueDate);
                const taskDateStr = taskDate.toISOString().split('T')[0];
                return taskDateStr === todayStr;
            });
        }
        if (taskFilter === 'upcoming') {
             return allPendingTasks.filter(t => {
                const taskDate = new Date(t.dueDate);
                const taskDateStr = taskDate.toISOString().split('T')[0];
                return taskDateStr > todayStr;
            });
        }
        return allPendingTasks;
    }, [allPendingTasks, taskFilter]);

    const todayStr = new Date().toISOString().split('T')[0];
    const completedTodayTasks = tasks.filter(t => t.status === 'tamamlandı' && t.completionDate === todayStr);
    
    if (activeTask) {
        return <ActiveTaskTimer task={activeTask} tasks={tasks} onComplete={completeTask} onFinishSession={() => setActiveTask(null)} initialTimerState={persistedTimerState} />;
    }
    if (activeReadingTask) {
        return <ActiveReadingSession task={activeReadingTask} tasks={tasks} onComplete={completeTask} onFinishSession={() => setActiveReadingTask(null)} initialTimerState={persistedTimerState} />;
    }

    const FilterButton: React.FC<{label: string, filter: TaskFilter}> = ({label, filter}) => (
        <button
            onClick={() => setTaskFilter(filter)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition ${taskFilter === filter ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
        >
            {label}
        </button>
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Günaydın, Genç Kaşif!";
        if (hour < 18) return "İyi çalışmalar!";
        return "İyi akşamlar!";
    };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unfinished Session Modal */}
        {unfinishedSessionTask && (
             <Modal show={showUnfinishedSessionModal} onClose={() => {}} title="Yarım Kalmış Seans">
                <div className="text-center">
                    <p className="text-lg text-slate-700">Görünüşe göre yarım kalmış bir <strong>'{unfinishedSessionTask.title}'</strong> seansın var.</p>
                    <p className="mt-2 text-sm text-slate-500">Ne yapmak istersin?</p>
                    <div className="mt-6 flex justify-center space-x-4">
                        <button onClick={handleDiscardSession} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center">
                            <Trash2 className="w-4 h-4 mr-2" /> İptal Et ve Sil
                        </button>
                         <button onClick={handleContinueSession} className="px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center">
                           <Play className="w-4 h-4 mr-2" /> Devam Et
                        </button>
                    </div>
                </div>
            </Modal>
        )}

        <Modal show={isFreeStudyModalOpen} onClose={() => setIsFreeStudyModalOpen(false)} title="Serbest Çalışma Başlat">
            <form onSubmit={handleStartFreeStudy} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-600">Çalışma Konusu</label>
                    <input type="text" value={freeStudyTitle} onChange={e => setFreeStudyTitle(e.target.value)} placeholder="Örn: Geometri Sınavı Tekrarı" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Ders</label>
                    <select value={freeStudyCourseId} onChange={e => setFreeStudyCourseId(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Ders seçimi">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Hedef Süre (dakika)</label>
                    <input type="number" value={freeStudyDuration} onChange={e => setFreeStudyDuration(Number(e.target.value))} required min="5" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" title="Süre (dakika)" placeholder="Süre (dk)"/>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition font-bold flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" /> Çalışmayı Oluştur ve Başlat
                </button>
            </form>
        </Modal>

        <div className="mb-8 p-6 bg-white rounded-xl shadow-md flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{getGreeting()}</h2>
                <p className="text-slate-500 mt-1">Bugün seni bekleyen {allPendingTasks.filter(t => new Date(t.dueDate) <= new Date()).length} görev var. Başarılar!</p>
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                    <Trophy className="w-8 h-8 text-amber-500" />
                    <span className="text-4xl font-bold text-amber-600">{successPoints}</span>
                </div>
                 <p className="text-sm font-semibold text-slate-600">Başarı Puanı</p>
            </div>
        </div>

        <div className="mb-6 border-b border-slate-200">
            <div className="flex space-x-4">
                <button onClick={() => setActiveView('tasks')} className={`flex items-center space-x-2 pb-3 font-semibold ${activeView === 'tasks' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}>
                    <Target className="w-5 h-5" />
                    <span>Görev Panosu</span>
                </button>
                <button onClick={() => setActiveView('treasures')} className={`flex items-center space-x-2 pb-3 font-semibold ${activeView === 'treasures' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}>
                    <Trophy className="w-5 h-5" />
                    <span>Hazine Odası</span>
                </button>
            </div>
        </div>

        {activeView === 'tasks' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Aktif Görevlerim</h3>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setIsFreeStudyModalOpen(true)} className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1.5 text-sm font-semibold rounded-full hover:bg-indigo-200 transition">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Serbest Çalışma Başlat
                            </button>
                            <FilterButton label="Bugün" filter="today" />
                            <FilterButton label="Yaklaşanlar" filter="upcoming" />
                            <FilterButton label="Tümü" filter="all" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {filteredPendingTasks.length > 0 ? (
                            filteredPendingTasks.map(task => <TaskCard key={task.id} task={task} courses={courses} onStart={handleStartTask} />)
                        ) : (
                            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                                <p className="text-slate-500">Bu filtreye uygun bekleyen görevin yok.</p>
                                <p className="text-slate-400 text-sm mt-1">Harika iş!</p>
                           </div>
                        )}
                    </div>
                    {completedTodayTasks.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold flex items-center text-slate-600"><CheckCircle className="w-6 h-6 mr-2 text-green-500"/> Bugün Tamamlananlar</h3>
                            <div className="space-y-4 mt-4">
                                {completedTodayTasks.map(task => <TaskCard key={task.id} task={task} courses={courses} onStart={() => {}} />)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6 sticky top-24">
                    <WeeklyPointsChart tasks={tasks} />
                    <MyLibrary tasks={tasks} />
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <RewardStore rewards={rewards} successPoints={successPoints} claimReward={claimReward} />
                 <MyAchievements badges={badges} />
            </div>
        )}
    </div>
  );
};

export default ChildDashboard;