import React, { useState } from 'react';
import { Task, TaskCompletionData } from '../../types';

interface ManualTaskCompletionModalProps {
    show: boolean;
    onClose: () => void;
    task: Task;
    onComplete: (taskId: string, data: TaskCompletionData) => void;
}

const getDefaultTimes = (dueDate: string) => {
    // Varsayılan olarak 17:00-18:00 arası öner
    return { start: '17:00', end: '18:00' };
};

const ManualTaskCompletionModal: React.FC<ManualTaskCompletionModalProps> = ({ show, onClose, task, onComplete }) => {
    const [startTime, setStartTime] = useState(getDefaultTimes(task.dueDate).start);
    const [endTime, setEndTime] = useState(getDefaultTimes(task.dueDate).end);
    const [pagesRead, setPagesRead] = useState('');
    const [correctCount, setCorrectCount] = useState('');
    const [incorrectCount, setIncorrectCount] = useState('');
    const [emptyCount, setEmptyCount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Saatleri kontrol et
        if (!startTime || !endTime) {
            setError('Lütfen görevin başlama ve bitiş saatlerini girin.');
            return;
        }
        // Saat formatı: HH:MM
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const start = new Date(task.dueDate + 'T' + startTime);
        const end = new Date(task.dueDate + 'T' + endTime);
        if (end <= start) {
            setError('Bitiş saati başlangıç saatinden daha geç olmalı.');
            return;
        }
        const actualDuration = Math.floor((end.getTime() - start.getTime()) / 1000); // saniye
        let completionData: TaskCompletionData = {
            actualDuration,
            breakTime: 0,
            pauseTime: 0,
        };
        if (task.taskType === 'kitap okuma') {
            if (!pagesRead || Number(pagesRead) <= 0) {
                setError('Lütfen kaç sayfa okuduğunuzu yazın.');
                return;
            }
            completionData.pagesRead = Number(pagesRead);
        }
        if (task.taskType === 'soru çözme') {
            const correct = Number(correctCount) || 0;
            const incorrect = Number(incorrectCount) || 0;
            const empty = Number(emptyCount) || 0;
            const total = correct + incorrect + empty;
            if (task.questionCount && total !== task.questionCount) {
                setError(`Toplam ${task.questionCount} soru olmalı.`);
                return;
            }
            completionData.correctCount = correct;
            completionData.incorrectCount = incorrect;
            completionData.emptyCount = empty;
        }
        // Tamamla
        onComplete(task.id, completionData);
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-center" onSubmit={handleSubmit}>
                <h3 className="text-lg sm:text-xl font-bold mb-2">Geçmiş Görev Tamamlama</h3>
                <p className="text-slate-600 text-sm sm:text-base mb-4">Geçmiş tarihli görev için süre ve detayları giriniz.</p>
                <div className="flex flex-col gap-3 mb-4 text-left">
                    <label className="text-sm font-semibold">Başlama Saati
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                    </label>
                    <label className="text-sm font-semibold">Bitiş Saati
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                    </label>
                    {task.taskType === 'kitap okuma' && (
                        <label className="text-sm font-semibold">Okunan Sayfa
                            <input type="number" min="1" value={pagesRead} onChange={e => setPagesRead(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                        </label>
                    )}
                    {task.taskType === 'soru çözme' && (
                        <>
                        <label className="text-sm font-semibold">Doğru Sayısı
                            <input type="number" min="0" max={task.questionCount} value={correctCount} onChange={e => setCorrectCount(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                        </label>
                        <label className="text-sm font-semibold">Yanlış Sayısı
                            <input type="number" min="0" max={task.questionCount} value={incorrectCount} onChange={e => setIncorrectCount(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                        </label>
                        <label className="text-sm font-semibold">Boş Sayısı
                            <input type="number" min="0" max={task.questionCount} value={emptyCount} onChange={e => setEmptyCount(e.target.value)} className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg mt-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required />
                        </label>
                        <div className="text-xs sm:text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded">Toplam: {(Number(correctCount)||0)+(Number(incorrectCount)||0)+(Number(emptyCount)||0)} / {task.questionCount}</div>
                        </>
                    )}
                </div>
                {error && <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded-lg border border-red-200">{error}</div>}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-4">
                    <button type="button" onClick={onClose} className="w-full px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">İptal</button>
                    <button type="submit" className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">Kaydet</button>
                </div>
            </form>
        </div>
    );
};

export default ManualTaskCompletionModal;