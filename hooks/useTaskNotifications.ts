import { useEffect, useCallback, useRef, useState } from 'react';
import { onSnapshot, query, where, orderBy, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Task } from '../types';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  taskId: string;
  type: 'task_assigned' | 'task_reminder' | 'reward_available' | 'achievement_earned';
  timestamp: number;
  read: boolean;
  urgent: boolean;
}

export interface TaskNotificationHookResult {
  notifications: NotificationData[];
  unreadCount: number;
  showNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  playNotificationSound: () => void;
}

export const useTaskNotifications = (): TaskNotificationHookResult => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastTaskCount, setLastTaskCount] = useState<number>(0);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  
  // Initialize notification sound
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    // Fallback: use a simple beep sound data URL
    try {
      notificationSound.current = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSCZ3/LIfCsFJH/M9t6RTgwUYbjr66NVFAhAn+H0wGwjBjie3fOF...'
      );
      notificationSound.current.volume = 0.3;
    } catch (error) {
      console.warn('Could not create notification sound:', error);
    }

    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);

  // Real-time task listener for new assignments
  useEffect(() => {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', '==', 'bekliyor'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      try {
        const currentTaskCount = snapshot.docs.length;
        
        // Check if new tasks were added (not on initial load)
        if (lastTaskCount > 0 && currentTaskCount > lastTaskCount) {
          const newTasks = snapshot.docs.slice(0, currentTaskCount - lastTaskCount);
          
          newTasks.forEach(doc => {
            const task = { id: doc.id, ...doc.data() } as Task;
            
            // Create notification for new task
            const notification: Omit<NotificationData, 'id' | 'timestamp'> = {
              title: 'Yeni Görev Atandı! 🎯',
              message: `"${task.title}" görevi için hazır mısın?`,
              taskId: task.id,
              type: 'task_assigned',
              read: false,
              urgent: task.taskType === 'soru çözme' || task.plannedDuration > 60
            };
            
            showNotification(notification);
          });
        }
        
        setLastTaskCount(currentTaskCount);
      } catch (error) {
        console.error('Task notification listener error:', error);
      }
    });

    return () => unsubscribe();
  }, [lastTaskCount]);

  // Show notification function
  const showNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Play notification sound
    playNotificationSound();
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.taskId,
        requireInteraction: notification.urgent,
        silent: false
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Navigate to task (you can customize this)
        const taskElement = document.getElementById(`task-${notification.taskId}`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'smooth' });
        }
      };

      // Auto close after 5 seconds if not urgent
      if (!notification.urgent) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
    
    // Auto-remove notification after 30 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 30000);
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(e => {
          console.warn('Could not play notification sound:', e);
        });
      }
    } catch (error) {
      console.warn('Notification sound error:', error);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    playNotificationSound
  };
};

// Request notification permission hook
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Notification permission error:', error);
        return 'denied';
      }
    }
    return 'denied';
  }, []);

  return { permission, requestPermission };
};

// Smart notification timing hook
export const useSmartNotifications = () => {
  const [optimalTimes, setOptimalTimes] = useState<number[]>([]);
  
  useEffect(() => {
    // Analyze user activity patterns from localStorage
    const activityData = localStorage.getItem('user_activity_pattern');
    
    if (activityData) {
      try {
        const pattern = JSON.parse(activityData);
        // Find optimal notification times based on user activity
        const times = pattern.activeTimes || [9, 15, 19]; // Default times
        setOptimalTimes(times);
      } catch (error) {
        console.error('Activity pattern parsing error:', error);
        setOptimalTimes([9, 15, 19]); // Fallback times
      }
    } else {
      setOptimalTimes([9, 15, 19]); // Default times
    }
  }, []);

  const isOptimalTime = useCallback(() => {
    const currentHour = new Date().getHours();
    return optimalTimes.includes(currentHour);
  }, [optimalTimes]);

  const getNextOptimalTime = useCallback(() => {
    const currentHour = new Date().getHours();
    const nextTime = optimalTimes.find(time => time > currentHour);
    return nextTime || optimalTimes[0]; // Return first time if no later time today
  }, [optimalTimes]);

  return { optimalTimes, isOptimalTime, getNextOptimalTime };
};