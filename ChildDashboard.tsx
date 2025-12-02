import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChildDashboardProps, Task, Reward, Badge, TaskCompletionData } from './types';
import { BookOpen, CheckCircle, Clock, Star, Trophy, Play, Pause, XCircle, Gift, Award, Smile, Frown, Meh, AlertTriangle, Sparkles } from './components/icons';
import WeeklyProgress from './components/child/WeeklyProgress';
import ActiveTaskBanner from './components/child/ActiveTaskBanner';
import TaskCompletionModal from './components/child/TaskCompletionModal';
import { getIconComponent } from './constants';

// Note: If react-confetti is not installed, we will skip it. I will implement a CSS based simple animation or just UI feedback.

// Helper for formatting duration
const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ChildDashboard: React.FC<ChildDashboardProps> = ({
    courses,
    tasks,
    performanceData,
    rewards,
    badges,
    successPoints,
    startTask,
    updateTaskStatus,
    completeTask,
    claimReward,
    addTask,
    ai,
    onShowTaskDetail
}) => {
    const [activeTab, setActiveTab] = useState<'gorevler' | 'oduller' | 'rozetler'>('gorevler');
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
    const [totalPauseSeconds, setTotalPauseSeconds] = useState(0);
    const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);

    // Task Completion Modal State
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionData, setCompletionData] = useState<Partial<TaskCompletionData>>({});
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    // Sınav için exam results state
    const [examResults, setExamResults] = useState<Array<{ courseId: string, correct: number, incorrect: number, net: number }>>([]);

    // Filtered Tasks
    const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'bekliyor' && !t.postponed), [tasks]);
    const completedTasks = useMemo(() => tasks.filter(t => t.status === 'tamamlandı'), [tasks]);

    // Active Task Logic - Load from LocalStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('childDashboardTimerState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.activeTaskId) {
                    setActiveTaskId(parsed.activeTaskId);

                    let currentSeconds = parsed.timerSeconds || 0;

                    // If it was running, calculate elapsed time since last save
                    if (parsed.isTimerRunning && parsed.lastUpdated) {
                        const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
                        if (elapsed > 0) {
                            currentSeconds += elapsed;
                        }
                    }

                    setTimerSeconds(currentSeconds);
                    setIsTimerRunning(parsed.isTimerRunning || false);
                    setTotalPauseSeconds(parsed.totalPauseSeconds || 0);
                    setPauseStartTime(parsed.pauseStartTime || null);
                }
            } catch (e) {
                console.error("Failed to parse timer state", e);
            }
        }
    }, []);

    // Save to LocalStorage whenever state changes
    useEffect(() => {
        if (activeTaskId) {
            const state = {
                activeTaskId,
                timerSeconds,
                isTimerRunning,
                totalPauseSeconds,
                pauseStartTime,
                lastUpdated: Date.now()
            };
            localStorage.setItem('childDashboardTimerState', JSON.stringify(state));
        } else {
            localStorage.removeItem('childDashboardTimerState');
        }
    }, [activeTaskId, timerSeconds, isTimerRunning, totalPauseSeconds, pauseStartTime]);

    useEffect(() => {
        if (isTimerRunning) {
            const interval = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
            setTimerInterval(interval);
            return () => clearInterval(interval);
        } else if (timerInterval) {
            clearInterval(timerInterval);
        }
    }, [isTimerRunning]);

    const handleStartTask = (taskId: string) => {
        if (activeTaskId) {
            alert("Şu anda zaten bir görev yapıyorsun! Önce onu bitir veya duraklat.");
            return;
        }
        startTask(taskId);
        setActiveTaskId(taskId);
        setIsTimerRunning(true);
        setTimerSeconds(0);
        setTotalPauseSeconds(0);
        setPauseStartTime(null);
    };

    const handlePauseTask = () => {
        setIsTimerRunning(false);
        setPauseStartTime(Date.now());
    };

    const handleResumeTask = () => {
        if (pauseStartTime) {
            const pausedDuration = (Date.now() - pauseStartTime) / 1000;
            setTotalPauseSeconds(prev => prev + pausedDuration);
            setPauseStartTime(null);
        }
        setIsTimerRunning(true);
    };

    const handleFinishClick = (task: Task) => {
        setIsTimerRunning(false);

        // If currently paused, add the pending pause time
        let finalPauseSeconds = totalPauseSeconds;
        if (pauseStartTime) {
            finalPauseSeconds += (Date.now() - pauseStartTime) / 1000;
        }

        setCompletingTask(task);
        setCompletionData({
            actualDuration: timerSeconds,
            breakTime: 0,
            pauseTime: Math.round(finalPauseSeconds)
        });
        
        // Sınav için exam results'ı initialize et
        if (task.taskType === 'sınav' && task.examConfig) {
            setExamResults(task.examConfig.courses.map(c => ({
                courseId: c.courseId,
                correct: 0,
                incorrect: 0,
                net: 0
            })));
        }
        
        setShowCompletionModal(true);
    };

    const submitCompletion = () => {
        if (!completingTask || !activeTaskId) return;

        const finalData: TaskCompletionData = {
            actualDuration: timerSeconds,
            breakTime: 0,
            pauseTime: completionData.pauseTime || 0,
            ...completionData
        };
        
        // Sınav için exam results ve totalNet ekle
        if (completingTask.taskType === 'sınav') {
            const totalNet = examResults.reduce((sum, r) => sum + r.net, 0);
            (finalData as any).examResults = examResults;
            (finalData as any).totalNet = Number(totalNet.toFixed(2));
        }

        completeTask(activeTaskId, finalData);
        setShowCompletionModal(false);
        setActiveTaskId(null);
        setTimerSeconds(0);
        setCompletingTask(null);
        setCompletionData({});
        setExamResults([]);
    };

    > = ({ tasks }) => {
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

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Stats Bar */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center space-x-2">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <Star className="w-6 h-6 text-amber-500" fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Puanım</p>
                            <p className="text-xl font-black text-slate-800">{successPoints}</p>
                        </div>
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('gorevler')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'gorevler' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Görevler
                        </button>
                        <button
                            onClick={() => setActiveTab('oduller')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'oduller' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Ödüller
                        </button>
                        <button
                            onClick={() => setActiveTab('rozetler')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'rozetler' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Rozetler
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4">
                {/* Active Task Banner */}
                <ActiveTaskBanner 
                    activeTaskId={activeTaskId}
                    tasks={tasks}
                    timerSeconds={timerSeconds}
                    isTimerRunning={isTimerRunning}
                    handlePauseTask={handlePauseTask}
                    handleResumeTask={handleResumeTask}
                    handleFinishClick={(task) => handleFinishClick(task)}
                    formatDuration={formatDuration}
                />

                {activeTab === 'gorevler' && (
                    <div className="space-y-6">
                        {/* Pending Tasks */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-primary-500" />
                                Yapılacaklar ({pendingTasks.length})
                            </h3>
                            {pendingTasks.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-100">
                                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Smile className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Harikasın!</h4>
                                    <p className="text-slate-500">Şu an bekleyen hiç görevin yok. Biraz dinlenmeyi hak ettin!</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {pendingTasks.map(task => {
                                        const CourseIcon = courses.find(c => c.id === task.courseId)?.icon || BookOpen;
                                        const IconComponent = typeof CourseIcon === 'string' ? getIconComponent(CourseIcon) : CourseIcon;
                                        const isLocked = activeTaskId !== null && activeTaskId !== task.id;

                                        return (
                                            <div key={task.id} className={`bg-white p-5 rounded-xl shadow-sm border-2 transition-all ${activeTaskId === task.id ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent hover:border-primary-200'} ${isLocked ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-3 rounded-lg ${activeTaskId === task.id ? 'bg-primary-100' : 'bg-slate-100'}`}>
                                                            <IconComponent className={`w-6 h-6 ${activeTaskId === task.id ? 'text-primary-600' : 'text-slate-500'}`} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{task.title}</h4>
                                                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{courses.find(c => c.id === task.courseId)?.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                                                        {task.plannedDuration} dk
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-4">
                                                    <div className="flex space-x-2 text-xs text-slate-500">
                                                        {task.taskType === 'soru çözme' && (
                                                            <span className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                                {task.questionCount} Soru
                                                            </span>
                                                        )}
                                                        {task.taskType === 'kitap okuma' && (
                                                            <span className="flex items-center bg-purple-50 text-purple-600 px-2 py-1 rounded">
                                                                Kitap
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!activeTaskId && (
                                                        <button
                                                            onClick={() => handleStartTask(task.id)}
                                                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center"
                                                        >
                                                            <Play className="w-4 h-4 mr-1.5" fill="currentColor" />
                                                            Başla
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Completed Tasks History */}
                        {completedTasks.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center opacity-75">
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                                    Tamamlananlar
                                </h3>
                                <div className="space-y-2 opacity-75 hover:opacity-100 transition-opacity">
                                    {completedTasks.slice(0, 5).map(task => (
                                        <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-green-100 p-1.5 rounded-full">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                </div>
                                                <span className="font-medium text-slate-700 line-through decoration-slate-300">{task.title}</span>
                                            </div>
                                            <span className="text-amber-500 font-bold text-sm">+{task.pointsAwarded} Puan</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <WeeklyProgress tasks={tasks} />
                    </div>
                )}

                {activeTab === 'oduller' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {rewards.map(reward => {
                            const Icon = typeof reward.icon === 'string' ? getIconComponent(reward.icon) : reward.icon;
                            const canAfford = successPoints >= reward.cost;

                            return (
                                <div key={reward.id} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${canAfford ? 'border-purple-100 hover:border-purple-300' : 'border-slate-100 opacity-70'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-purple-50 p-3 rounded-xl">
                                            <Icon className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold text-sm">
                                            {reward.cost} Puan
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">{reward.name}</h4>
                                    <button
                                        onClick={() => claimReward(reward.id)}
                                        disabled={!canAfford}
                                        className={`w-full py-2 rounded-lg font-bold transition-colors ${canAfford ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {canAfford ? 'Ödülü Al' : 'Puan Yetersiz'}
                                    </button>
                                </div>
                            );
                        })}
                        {rewards.length === 0 && (
                            <div className="col-span-full text-center py-10">
                                <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Henüz ödül eklenmemiş. Ebeveyninden ödül eklemesini iste!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rozetler' && (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        {badges.map(badge => {
                            const Icon = typeof badge.icon === 'string' ? getIconComponent(badge.icon) : badge.icon;
                            return (
                                <div key={badge.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
                                    <div className="bg-amber-50 p-4 rounded-full mb-3">
                                        <Icon className="w-10 h-10 text-amber-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">{badge.name}</h4>
                                    <p className="text-xs text-slate-500">{badge.description}</p>
                                </div>
                            );
                        })}
                        {badges.length === 0 && (
                            <div className="col-span-full text-center py-10">
                                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Henüz hiç rozet kazanmadın. Görevleri tamamla ve rozetleri topla!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Completion Modal */}
            <TaskCompletionModal 
                show={showCompletionModal}
                task={completingTask}
                timerSeconds={timerSeconds}
                formatDuration={formatDuration}
                completionData={completionData}
                setCompletionData={setCompletionData}
                examResults={examResults}
                setExamResults={setExamResults}
                submitCompletion={submitCompletion}
                courses={courses}
                onClose={() => setShowCompletionModal(false)}
            />
        </div>
    );
};

export default ChildDashboard;
