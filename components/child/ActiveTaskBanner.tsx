import React from 'react';
import { Task } from '../../types';
import { Play, Pause, CheckCircle } from './icons'; // Need to ensure icons exist or use lucide-react

interface ActiveTaskBannerProps {
    activeTaskId: string | null;
    tasks: Task[];
    timerSeconds: number;
    isTimerRunning: boolean;
    handlePauseTask: () => void;
    handleResumeTask: () => void;
    handleFinishClick: (task: Task) => void;
    formatDuration: (seconds: number) => string;
}

const ActiveTaskBanner: React.FC<ActiveTaskBannerProps> = ({
    activeTaskId,
    tasks,
    timerSeconds,
    isTimerRunning,
    handlePauseTask,
    handleResumeTask,
    handleFinishClick,
    formatDuration
}) => {
    if (!activeTaskId) return null;
    
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return null;

    return (
        <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-lg mb-6 transform transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold animate-pulse">ŞU AN YAPILIYOR</span>
                        <span className="text-primary-100 text-sm">
                            {task.taskType}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{task.title}</h2>
                    <p className="text-primary-100 text-sm opacity-90">Odaklan ve harika işler çıkar!</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono font-bold mb-2 tracking-wider">{formatDuration(timerSeconds)}</div>
                    <div className="flex space-x-2 justify-end">
                        {isTimerRunning ? (
                            <button onClick={handlePauseTask} className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-colors">
                                <Pause className="w-6 h-6" fill="currentColor" />
                            </button>
                        ) : (
                            <button onClick={handleResumeTask} className="bg-white text-primary-600 hover:bg-primary-50 p-3 rounded-full shadow-lg transition-colors">
                                <Play className="w-6 h-6" fill="currentColor" />
                            </button>
                        )}
                        <button
                            onClick={() => handleFinishClick(task)}
                            className="bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-colors flex items-center"
                        >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Bitir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveTaskBanner;
