import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, Clock, Zap, Gift, Trophy, AlertTriangle, Settings } from '../icons';
import { useTaskNotifications, useNotificationPermission, useSmartNotifications, NotificationData } from '../../hooks/useTaskNotifications';
import { Task } from '../../types';

interface RealtimeNotificationCenterProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

const RealtimeNotificationCenter: React.FC<RealtimeNotificationCenterProps> = ({ 
  tasks, 
  onTaskClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    playNotificationSound
  } = useTaskNotifications();
  
  const { permission, requestPermission } = useNotificationPermission();
  const { optimalTimes, isOptimalTime } = useSmartNotifications();

  // Load sound settings from localStorage
  useEffect(() => {
    const savedSoundSetting = localStorage.getItem('notification_sound_enabled');
    if (savedSoundSetting !== null) {
      setSoundEnabled(JSON.parse(savedSoundSetting));
    }
  }, []);

  // Save sound settings to localStorage
  const toggleSound = () => {
    const newSetting = !soundEnabled;
    setSoundEnabled(newSetting);
    localStorage.setItem('notification_sound_enabled', JSON.stringify(newSetting));
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case 'task_assigned':
        return <CheckCircle className={`${iconClass} text-blue-500`} />;
      case 'task_reminder':
        return <Clock className={`${iconClass} text-amber-500`} />;
      case 'reward_available':
        return <Gift className={`${iconClass} text-green-500`} />;
      case 'achievement_earned':
        return <Trophy className={`${iconClass} text-purple-500`} />;
      default:
        return <Bell className={`${iconClass} text-slate-500`} />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes}dk önce`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa önce`;
    
    const days = Math.floor(hours / 24);
    return `${days}g önce`;
  };

  const getNotificationPriority = (notification: NotificationData) => {
    if (notification.urgent) return 'urgent';
    if (notification.type === 'task_assigned') return 'high';
    if (notification.type === 'achievement_earned') return 'medium';
    return 'low';
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    // Sort by read status first, then by urgency, then by timestamp
    if (a.read !== b.read) return a.read ? 1 : -1;
    
    const priorityA = getNotificationPriority(a);
    const priorityB = getNotificationPriority(b);
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    if (priorityA !== priorityB) {
      return priorityOrder[priorityA as keyof typeof priorityOrder] - 
             priorityOrder[priorityB as keyof typeof priorityOrder];
    }
    
    return b.timestamp - a.timestamp;
  });

  const handleNotificationClick = (notification: NotificationData) => {
    markAsRead(notification.id);
    
    if (notification.taskId && onTaskClick) {
      onTaskClick(notification.taskId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell with Smart Indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          unreadCount > 0 
            ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
            : 'text-slate-600 hover:text-primary-600 hover:bg-primary-50'
        }`}
        aria-label={`Bildirimler ${unreadCount > 0 ? `(${unreadCount} okunmamış)` : ''}`}
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
        
        {/* Smart indicator for optimal notification times */}
        {isOptimalTime() && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
        )}
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden">
            
            {/* Header with Settings */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-slate-800">Anlık Bildirimler</h3>
                {isOptimalTime() && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                    Optimal Zaman
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold px-2 py-1 rounded"
                  >
                    Tümünü Okundu İşaretle
                  </button>
                )}
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-slate-500 hover:text-slate-700 rounded"
                  aria-label="Bildirim ayarları"
                  title="Bildirim ayarları"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Bildirim Ayarları</h4>
                
                <div className="space-y-3">
                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Bildirim Sesi</span>
                    <button
                      onClick={toggleSound}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        soundEnabled ? 'bg-primary-600' : 'bg-slate-300'
                      }`}
                      aria-label={`Bildirim sesi ${soundEnabled ? 'açık' : 'kapalı'}`}
                      title={`Bildirim sesi ${soundEnabled ? 'açık' : 'kapalı'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Browser Permissions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Tarayıcı Bildirimleri</span>
                    {permission === 'granted' ? (
                      <span className="text-xs text-green-600 font-semibold">Açık</span>
                    ) : (
                      <button
                        onClick={requestPermission}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded font-semibold hover:bg-primary-700"
                      >
                        İzin Ver
                      </button>
                    )}
                  </div>

                  {/* Test Notification */}
                  <button
                    onClick={playNotificationSound}
                    className="w-full text-xs bg-slate-200 text-slate-700 px-3 py-2 rounded hover:bg-slate-300 font-semibold"
                  >
                    Test Bildirimi
                  </button>

                  {/* Clear All */}
                  <button
                    onClick={clearAllNotifications}
                    className="w-full text-xs bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 font-semibold"
                  >
                    Tüm Bildirimleri Temizle
                  </button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {sortedNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">Henüz bildirim yok</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Yeni görev atamaları burada görünecek
                  </p>
                </div>
              ) : (
                sortedNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`group relative p-4 border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer ${
                      !notification.read ? 'bg-primary-25 border-l-4 border-l-primary-500' : ''
                    } ${notification.urgent ? 'bg-red-25 border-l-4 border-l-red-500' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-semibold ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.urgent && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition"
                              aria-label="Bildirimi sil"
                              title="Bildirimi sil"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>

                        {/* Action buttons for unread notifications */}
                        {!notification.read && (
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                            >
                              Okundu İşaretle
                            </button>
                            
                            {notification.taskId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                                className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 font-semibold"
                              >
                                Görevi Aç
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with optimal times info */}
            {optimalTimes.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  <Zap className="w-3 h-3 inline mr-1" />
                  En aktif olduğunuz saatler: {optimalTimes.map(t => `${t}:00`).join(', ')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RealtimeNotificationCenter;