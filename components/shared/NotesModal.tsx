import React, { useState } from 'react';
import { X, FileText } from '../icons';

interface NotesModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (note: string) => void;
    taskName: string;
    initialNote?: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ 
    show, 
    onClose, 
    onSave, 
    taskName, 
    initialNote = '' 
}) => {
    const [note, setNote] = useState(initialNote);

    if (!show) return null;

    const handleSave = () => {
        onSave(note);
        onClose();
    };

    const handleClose = () => {
        setNote(initialNote); // Reset to initial value
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Not Ekle</h3>
                    </div>
                    <button 
                        onClick={handleClose} 
                        aria-label="Kapat" 
                        title="Kapat" 
                        className="text-gray-500 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{taskName}</span> görevi için not:
                        </p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nerede kaldığını, ne düşündügünü veya hatırlamanı istedigin şeyleri yaz..."
                            className="w-full h-32 sm:h-40 px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {note.length}/500 karakter
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Kaydet ve Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;