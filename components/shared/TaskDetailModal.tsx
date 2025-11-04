import React, { useState } from 'react';
import { X, Edit, Clock, Target, BookOpen, User, Calendar, Star, Trophy, AlertCircle } from '../icons';
import { Task, Course } from '../../types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TaskDetailModalProps {
    show: boolean;
    onClose: () => void;
    task: Task | null;
    courses: Course[];
    canEdit?: boolean;
    onEdit?: (taskId: string) => void;
    onTaskUpdate?: (updatedTask: Task) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    show,
    onClose,
    task,
    courses,
    canEdit = false,
    onEdit,
    onTaskUpdate
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Task | null>(null);

    if (!show || !task) return null;

    const course = courses.find(c => c.id === task.courseId);
    const courseName = course?.name || 'Bilinmeyen Ders';

    // Görev türüne göre ikon seçimi
    const getTaskIcon = () => {
        switch (task.taskType) {
            case 'soru çözme':
                return <Target className="w-5 h-5" />;
            case 'kitap okuma':
                return <BookOpen className="w-5 h-5" />;
            case 'ders çalışma':
            default:
                return <Edit className="w-5 h-5" />;
        }
    };

    // Durum rengini getir
    const getStatusColor = () => {
        if (task.status === 'tamamlandı') {
            return 'text-green-600 bg-green-100';
        } else if (task.postponed) {
            return 'text-orange-600 bg-orange-100';
        } else {
            return 'text-blue-600 bg-blue-100';
        }
    };

    // Süreyi formatla
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '-';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}s ${minutes}dk ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}dk ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    // Başarı puanını renklendir
    const getScoreColor = (score?: number) => {
        if (!score) return 'text-gray-500';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const handleEdit = () => {
        setEditedTask({ ...task });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editedTask && onTaskUpdate) {
            onTaskUpdate(editedTask);
        }
        setIsEditing(false);
        setEditedTask(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedTask(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                {getTaskIcon()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
                                <p className="text-sm text-gray-500">{courseName}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {canEdit && !isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Görevi Düzenle"
                                    aria-label="Görevi Düzenle"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Modalı Kapat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Durum Badge */}
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                            {task.status === 'tamamlandı' ? 'Tamamlandı' : 
                             task.postponed ? 'Ertelendi' : 'Bekliyor'}
                        </span>
                        {task.isSelfAssigned && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                                Kendi Kendine Atandı
                            </span>
                        )}
                    </div>

                    {/* Açıklama */}
                    {task.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 mb-2">Açıklama</h3>
                            <p className="text-gray-600">{task.description}</p>
                        </div>
                    )}

                    {/* Temel Bilgiler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tarih Bilgileri */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Tarih Bilgileri
                            </h3>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Son Tarih:</span>
                                    <span className="font-medium">
                                        {format(parseISO(task.dueDate), 'dd MMMM yyyy', { locale: tr })}
                                    </span>
                                </div>
                                
                                {task.completionDate && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tamamlama Tarihi:</span>
                                        <span className="font-medium text-green-600">
                                            {format(parseISO(task.completionDate), 'dd MMMM yyyy', { locale: tr })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Süre Bilgileri */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                Süre Bilgileri
                            </h3>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Planlanan Süre:</span>
                                    <span className="font-medium">{task.plannedDuration} dakika</span>
                                </div>
                                
                                {task.actualDuration && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Gerçek Süre:</span>
                                        <span className="font-medium">
                                            {formatDuration(task.actualDuration)}
                                        </span>
                                    </div>
                                )}
                                
                                {task.breakTime && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Mola Süresi:</span>
                                        <span className="font-medium text-orange-600">
                                            {formatDuration(task.breakTime)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Görev Detayları */}
                    {(task.questionCount || task.bookTitle || task.correctCount !== undefined) && (
                        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-gray-700">Görev Detayları</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {task.questionCount && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Soru Sayısı:</span>
                                        <span className="font-medium">{task.questionCount}</span>
                                    </div>
                                )}
                                
                                {task.bookTitle && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kitap:</span>
                                            <span className="font-medium">{task.bookTitle}</span>
                                        </div>
                                        {task.bookGenre && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tür:</span>
                                                <span className="font-medium">{task.bookGenre}</span>
                                            </div>
                                        )}
                                        {task.pagesRead && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Okunan Sayfa:</span>
                                                <span className="font-medium">{task.pagesRead}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                
                                {task.correctCount !== undefined && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Doğru:</span>
                                            <span className="font-medium text-green-600">{task.correctCount}</span>
                                        </div>
                                        {task.incorrectCount !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Yanlış:</span>
                                                <span className="font-medium text-red-600">{task.incorrectCount}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Performans Skorları */}
                    {(task.successScore !== undefined || task.focusScore !== undefined || task.pointsAwarded) && (
                        <div className="bg-green-50 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center">
                                <Star className="w-4 h-4 mr-2" />
                                Performans Skorları
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {task.successScore !== undefined && (
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <div className={`text-2xl font-bold ${getScoreColor(task.successScore)}`}>
                                            {task.successScore}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Başarı Puanı</div>
                                    </div>
                                )}
                                
                                {task.focusScore !== undefined && (
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <div className={`text-2xl font-bold ${getScoreColor(task.focusScore)}`}>
                                            {task.focusScore}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Odaklanma Puanı</div>
                                    </div>
                                )}
                                
                                {task.pointsAwarded && (
                                    <div className="text-center p-3 bg-white rounded-lg border">
                                        <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 mr-1" />
                                            {task.pointsAwarded}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Kazanılan Puan</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Edit Mode - Basit düzenleme */}
                    {isEditing && editedTask && (
                        <div className="border-t pt-6 space-y-4">
                            <h3 className="font-semibold text-gray-700">Görev Düzenleme</h3>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                                    <input
                                        type="text"
                                        value={editedTask.title}
                                        onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                                        placeholder="Görev başlığını girin"
                                        aria-label="Görev başlığı"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                    <textarea
                                        value={editedTask.description || ''}
                                        onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                                        placeholder="Görev açıklamasını girin"
                                        aria-label="Görev açıklaması"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;