import React, { useState } from 'react';
import { Gift, PlusCircle, Trash2 } from '../icons';
import { Reward } from '../../types';

interface RewardsManagerProps {
    rewards: Reward[];
    addReward: (reward: Omit<Reward, 'id'>) => void;
    deleteReward: (id: string) => void;
}

const RewardsManager: React.FC<RewardsManagerProps> = ({ rewards, addReward, deleteReward }) => {
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [pointCost, setPointCost] = useState<number | ''>('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && pointCost && Number(pointCost) > 0) {
            addReward({
                title: title.trim(),
                pointCost: Number(pointCost),
                description: description.trim() || undefined
            });
            setTitle('');
            setPointCost('');
            setDescription('');
            setShowModal(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center">
                    <Gift className="w-6 h-6 mr-2 text-amber-600" />
                    Ödül Sistemi
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition flex items-center"
                >
                    <PlusCircle className="w-5 h-5 mr-2" /> Ödül Ekle
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Yeni Ödül Ekle</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800 text-3xl font-light">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ödül Adı</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="Örn: Dondurma, Oyun Süresi"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Puan Maliyeti</label>
                                <input
                                    type="number"
                                    value={pointCost}
                                    onChange={e => setPointCost(e.target.value === '' ? '' : Number(e.target.value))}
                                    required
                                    min="1"
                                    placeholder="Kaç puan gerekli?"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ödül hakkında detaylar..."
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-amber-600 text-white py-2 rounded-lg font-bold hover:bg-amber-700 transition"
                            >
                                Ödül Ekle
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {rewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rewards.map(reward => (
                        <div key={reward.id} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 relative">
                            <button
                                onClick={() => deleteReward(reward.id)}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                                title="Ödülü Sil"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-start space-x-3">
                                <Gift className="w-8 h-8 text-amber-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800">{reward.title}</h4>
                                    {reward.description && (
                                        <p className="text-sm text-slate-600 mt-1">{reward.description}</p>
                                    )}
                                    <div className="mt-2 inline-flex items-center bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        {reward.pointCost} BP
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Henüz ödül eklenmemiş.</p>
                    <p className="text-sm text-slate-400 mt-2">Çocuğunuzu motive etmek için ödüller ekleyin!</p>
                </div>
            )}
        </div>
    );
};

export default RewardsManager;
