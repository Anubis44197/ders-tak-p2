/**
 * 🔔 Notification Service - Anti-Spam Notification Management
 * Bildirim spam'ını önleyen merkezi bildirim yönetimi
 */

export interface NotificationItem {
  id: string;
  type: 'due_soon' | 'daily_goal' | 'streak_danger' | 'completed_task' | 'missing_task';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  taskId?: string;
  expiresAt?: Date;
}

export interface NotificationRule {
  type: string;
  cooldownMinutes: number;
  maxPerDay: number;
  requiresUserAction: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, NotificationItem> = new Map();
  private notificationHistory: Map<string, Date[]> = new Map();
  private lastTaskCheck: Date = new Date();
  
  // Anti-spam rules
  private rules: NotificationRule[] = [
    { type: 'due_soon', cooldownMinutes: 60, maxPerDay: 3, requiresUserAction: false },
    { type: 'daily_goal', cooldownMinutes: 180, maxPerDay: 1, requiresUserAction: false },
    { type: 'completed_task', cooldownMinutes: 30, maxPerDay: 5, requiresUserAction: false },
    { type: 'missing_task', cooldownMinutes: 120, maxPerDay: 2, requiresUserAction: true },
    { type: 'streak_danger', cooldownMinutes: 240, maxPerDay: 1, requiresUserAction: true }
  ];

  private constructor() {
    this.loadFromStorage();
    
    // Auto cleanup expired notifications
    setInterval(() => this.cleanupExpired(), 60000); // Every minute
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Notification oluşturur (anti-spam kontrolü ile)
   */
  public createNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): boolean {
    const rule = this.rules.find(r => r.type === notification.type);
    if (!rule) return false;

    const notificationId = `${notification.type}_${notification.taskId || Date.now()}`;
    
    // Duplicate check
    if (this.notifications.has(notificationId)) {
      return false;
    }

    // Cooldown check
    if (!this.checkCooldown(notification.type, rule.cooldownMinutes)) {
      console.log(`🔇 Notification blocked by cooldown: ${notification.type}`);
      return false;
    }

    // Daily limit check
    if (!this.checkDailyLimit(notification.type, rule.maxPerDay)) {
      console.log(`🔇 Notification blocked by daily limit: ${notification.type}`);
      return false;
    }

    // Create notification
    const newNotification: NotificationItem = {
      id: notificationId,
      timestamp: new Date(),
      isRead: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ...notification
    };

    this.notifications.set(notificationId, newNotification);
    this.recordNotification(notification.type);
    this.saveToStorage();
    
    console.log(`✅ Notification created: ${notification.type} - ${notification.title}`);
    return true;
  }

  /**
   * Task bazlı bildirimleri analiz eder
   */
  public analyzeAndCreateNotifications(tasks: any[]): NotificationItem[] {
    const now = new Date();
    const createdNotifications: NotificationItem[] = [];

    // Rate limiting: Only analyze every 5 minutes
    if (now.getTime() - this.lastTaskCheck.getTime() < 5 * 60 * 1000) {
      return Array.from(this.notifications.values()).filter(n => !n.isRead);
    }

    this.lastTaskCheck = now;

    // 1. Yaklaşan görevler (24 saat içinde)
    const upcomingTasks = tasks.filter(t => 
      (t.status === 'bekliyor' || t.status === 'devam ediyor') && 
      t.status !== 'tamamlandı'
    );

    upcomingTasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      if (isNaN(dueDate.getTime())) return;

      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
        const created = this.createNotification({
          type: 'due_soon',
          title: 'Görev Hatırlatma',
          message: `"${task.title}" görevi ${Math.ceil(hoursUntilDue)} saat içinde!`,
          priority: hoursUntilDue <= 6 ? 'high' : 'medium',
          taskId: task.id
        });

        if (created) {
          createdNotifications.push(this.notifications.get(`due_soon_${task.id}`)!);
        }
      }
    });

    // 2. Eksik görevler
    const overdueTasks = tasks.filter(t =>
      t.status !== 'tamamlandı' &&
      new Date(t.dueDate) < now &&
      !t.postponed
    );

    if (overdueTasks.length > 0) {
      const created = this.createNotification({
        type: 'missing_task',
        title: 'Eksik Görev Uyarısı',
        message: `${overdueTasks.length} tamamlanmamış görev var!`,
        priority: 'high'
      });

      if (created) {
        const notificationId = Array.from(this.notifications.keys()).find(k => k.startsWith('missing_task_'));
        if (notificationId) {
          createdNotifications.push(this.notifications.get(notificationId)!);
        }
      }
    }

    // 3. Günlük tebrik (akşam saatleri)
    const today = now.toISOString().split('T')[0];
    const todayCompleted = tasks.filter(t => 
      t.status === 'tamamlandı' && 
      t.completionDate === today
    );

    if (todayCompleted.length > 0 && now.getHours() >= 17) {
      const created = this.createNotification({
        type: 'completed_task',
        title: 'Günlük Başarı!',
        message: `Bugün ${todayCompleted.length} görev tamamladın! 🎉`,
        priority: 'medium'
      });

      if (created) {
        const notificationId = Array.from(this.notifications.keys()).find(k => k.startsWith('completed_task_'));
        if (notificationId) {
          createdNotifications.push(this.notifications.get(notificationId)!);
        }
      }
    }

    // 4. Günlük hedef uyarısı (sadece akşam)
    const noTasksToday = todayCompleted.length === 0;
    if (noTasksToday && now.getHours() >= 19) {
      this.createNotification({
        type: 'daily_goal',
        title: 'Günlük Hedef',
        message: 'Bugün henüz görev tamamlamadın. Küçük bir adım at!',
        priority: 'low'
      });
    }

    return createdNotifications;
  }

  /**
   * Cooldown kontrolü
   */
  private checkCooldown(type: string, cooldownMinutes: number): boolean {
    const history = this.notificationHistory.get(type) || [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - cooldownMinutes * 60 * 1000);
    
    const recentNotifications = history.filter(date => date > cutoff);
    return recentNotifications.length === 0;
  }

  /**
   * Günlük limit kontrolü
   */
  private checkDailyLimit(type: string, maxPerDay: number): boolean {
    const history = this.notificationHistory.get(type) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayNotifications = history.filter(date => date >= today);
    return todayNotifications.length < maxPerDay;
  }

  /**
   * Notification kaydı tut
   */
  private recordNotification(type: string): void {
    const history = this.notificationHistory.get(type) || [];
    history.push(new Date());
    
    // Keep only last 50 entries per type
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.notificationHistory.set(type, history);
  }

  /**
   * Süresi dolmuş bildirimleri temizle
   */
  private cleanupExpired(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired notifications`);
      this.saveToStorage();
    }
  }

  /**
   * Notification'ları getir
   */
  public getNotifications(): NotificationItem[] {
    return Array.from(this.notifications.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Notification'ı okundu olarak işaretle
   */
  public markAsRead(id: string): boolean {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Tümünü okundu işaretle
   */
  public markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      notification.isRead = true;
    }
    this.saveToStorage();
  }

  /**
   * Notification'ı sil
   */
  public deleteNotification(id: string): boolean {
    const success = this.notifications.delete(id);
    if (success) {
      this.saveToStorage();
    }
    return success;
  }

  /**
   * Tümünü temizle
   */
  public clearAll(): void {
    this.notifications.clear();
    this.saveToStorage();
  }

  /**
   * Okunmamış sayısı
   */
  public getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.isRead).length;
  }

  /**
   * Task tamamlandığında ilgili bildirimleri temizle
   */
  public clearTaskNotifications(taskId: string): void {
    let cleaned = false;
    for (const [id, notification] of this.notifications) {
      if (notification.taskId === taskId) {
        this.notifications.delete(id);
        cleaned = true;
      }
    }
    
    if (cleaned) {
      this.saveToStorage();
    }
  }

  /**
   * localStorage'a kaydet
   */
  private saveToStorage(): void {
    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        history: Array.from(this.notificationHistory.entries()),
        lastCheck: this.lastTaskCheck
      };
      localStorage.setItem('notificationService', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }

  /**
   * localStorage'dan yükle
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('notificationService');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Restore notifications
        if (data.notifications) {
          this.notifications = new Map(data.notifications.map(([id, notif]: [string, any]) => [
            id,
            {
              ...notif,
              timestamp: new Date(notif.timestamp),
              expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined
            }
          ]));
        }
        
        // Restore history
        if (data.history) {
          this.notificationHistory = new Map(data.history.map(([type, dates]: [string, string[]]) => [
            type,
            dates.map(d => new Date(d))
          ]));
        }
        
        // Restore last check
        if (data.lastCheck) {
          this.lastTaskCheck = new Date(data.lastCheck);
        }
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
    }
  }
}

// Singleton instance export
export const notificationService = NotificationService.getInstance();