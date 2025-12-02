import React from 'react';
import { BookOpen, ClipboardList, CheckCircle, Trophy } from '../../icons';


const Modal: React.FC<{ show: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} aria-label="Kapat" title="Kapat" className="text-slate-500 hover:text-slate-800 text-3xl font-light">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};


export default Modal;
