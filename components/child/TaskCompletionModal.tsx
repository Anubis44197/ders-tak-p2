import React from 'react';
import { Task, Course, TaskCompletionData } from '../../types';

interface TaskCompletionModalProps {
    show: boolean;
    task: Task | null;
    timerSeconds: number;
    formatDuration: (seconds: number) => string;
    completionData: Partial<TaskCompletionData>;
    setCompletionData: React.Dispatch<React.SetStateAction<Partial<TaskCompletionData>>>;
    examResults: Array<{ courseId: string, correct: number, incorrect: number, net: number }>;
    setExamResults: React.Dispatch<React.SetStateAction<Array<{ courseId: string, correct: number, incorrect: number, net: number }>>>;
    submitCompletion: () => void;
    courses: Course[];
    onClose: () => void;
}

const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
    show,
    task,
    timerSeconds,
    formatDuration,
    completionData,
    setCompletionData,
    examResults,
    setExamResults,
    submitCompletion,
    courses,
    onClose
}) => {
    if (!show || !task) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-green-500 p-6 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl">&times;</button>
                    <h2 className="text-3xl font-black mb-2">Tebrikler! 🎉</h2>
                    <p className="text-green-100 text-lg">Bir görevi daha başarıyla tamamladın!</p>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800">{task.title}</h3>
                        <p className="text-slate-500">{task.courseId}</p>
                    </div>

                    {task.taskType === 'soru çözme' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-green-700 mb-1">Doğru Sayısı</label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-green-100 rounded-lg p-2 text-center font-bold text-lg focus:border-green-500 focus:outline-none"
                                    placeholder="0"
                                    onChange={e => setCompletionData(prev => ({ ...prev, correctCount: Number(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-red-700 mb-1">Yanlış Sayısı</label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-red-100 rounded-lg p-2 text-center font-bold text-lg focus:border-red-500 focus:outline-none"
                                    placeholder="0"
                                    onChange={e => setCompletionData(prev => ({ ...prev, incorrectCount: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                    )}

                    {task.taskType === 'kitap okuma' && (
                        <div>
                            <label className="block text-sm font-bold text-purple-700 mb-1">Kaç Sayfa Okudun?</label>
                            <input
                                type="number"
                                className="w-full border-2 border-purple-100 rounded-lg p-2 text-center font-bold text-lg focus:border-purple-500 focus:outline-none"
                                placeholder="0"
                                onChange={e => setCompletionData(prev => ({ ...prev, pagesRead: Number(e.target.value) }))}
                            />
                        </div>
                    )}

                    {task.taskType === 'sınav' && task.examConfig && (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <h4 className="font-bold text-purple-900 mb-2 text-center">📝 Sınav Sonuçlarını Gir</h4>
                                <p className="text-sm text-purple-700 text-center">Her ders için doğru ve yanlış sayılarını gir</p>
                            </div>
                            {examResults.map((result, idx) => {
                                const course = courses.find(c => c.id === result.courseId);
                                const questionCount = task.examConfig?.courses.find(c => c.courseId === result.courseId)?.questionCount || 0;
                                return (
                                    <div key={result.courseId} className="bg-white p-4 rounded-lg border-2 border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-bold text-slate-800">{course?.name || 'Ders'}</h5>
                                            <span className="text-sm text-slate-500">{questionCount} soru</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-green-700 mb-1">Doğru</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={questionCount}
                                                    className="w-full border-2 border-green-100 rounded-lg p-2 text-center font-bold focus:border-green-500 focus:outline-none"
                                                    placeholder="0"
                                                    value={result.correct || ''}
                                                    onChange={e => {
                                                        const correct = Number(e.target.value);
                                                        setExamResults(prev => {
                                                            const newResults = [...prev];
                                                            newResults[idx] = {
                                                                ...newResults[idx],
                                                                correct,
                                                                net: Number((correct - (newResults[idx].incorrect / 3)).toFixed(2))
                                                            };
                                                            return newResults;
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-red-700 mb-1">Yanlış</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={questionCount}
                                                    className="w-full border-2 border-red-100 rounded-lg p-2 text-center font-bold focus:border-red-500 focus:outline-none"
                                                    placeholder="0"
                                                    value={result.incorrect || ''}
                                                    onChange={e => {
                                                        const incorrect = Number(e.target.value);
                                                        setExamResults(prev => {
                                                            const newResults = [...prev];
                                                            newResults[idx] = {
                                                                ...newResults[idx],
                                                                incorrect,
                                                                net: Number((newResults[idx].correct - (incorrect / 3)).toFixed(2))
                                                            };
                                                            return newResults;
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-700 mb-1">Net</label>
                                                <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-lg p-2 text-center font-bold text-purple-900">
                                                    {result.net.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white text-center">
                                <p className="text-sm font-semibold mb-1">TOPLAM NET</p>
                                <p className="text-3xl font-black">{examResults.reduce((sum, r) => sum + r.net, 0).toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <p className="text-sm text-slate-500 mb-1">Toplam Süre</p>
                        <p className="text-2xl font-mono font-bold text-slate-800">{formatDuration(timerSeconds)}</p>
                    </div>

                    <button
                        onClick={submitCompletion}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
                    >
                        Kaydet ve Puanı Kap!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskCompletionModal;
