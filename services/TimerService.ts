/**
 * ⏱️ Timer Service - Centralized Timer Management
 * Timer memory leaks ve arka plan çalışma sorunlarını çözer
 */

export interface TimerState {
  mainTime: number;
  breakTime: number;
  pauseTime: number;
  status: 'running' | 'paused' | 'break';
  isPaused?: boolean;
  pausedAt?: number;
  note?: string;
}

export interface TimerCallbacks {
  onMainTimeUpdate: (time: number) => void;
  onBreakTimeUpdate: (time: number) => void;
  onPauseTimeUpdate: (time: number) => void;
}

class TimerService {
  private static instance: TimerService;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private timerStates: Map<string, TimerState> = new Map();
  private callbacks: Map<string, TimerCallbacks> = new Map();

  private constructor() {}

  public static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }

  /**
   * Timer başlatır veya devam ettirir
   */
  public startTimer(taskId: string, initialState: TimerState, callbacks: TimerCallbacks): void {
    // Mevcut timer'ı temizle
    this.stopTimer(taskId);

    // State'i kaydet
    this.timerStates.set(taskId, { ...initialState });
    this.callbacks.set(taskId, callbacks);

    // Yeni interval başlat
    const interval = setInterval(() => {
      const state = this.timerStates.get(taskId);
      if (!state) {
        this.stopTimer(taskId);
        return;
      }

      const updatedState = { ...state };

      switch (state.status) {
        case 'running':
          updatedState.mainTime += 1;
          callbacks.onMainTimeUpdate(updatedState.mainTime);
          break;
        case 'break':
          updatedState.breakTime += 1;
          callbacks.onBreakTimeUpdate(updatedState.breakTime);
          break;
        case 'paused':
          updatedState.pauseTime += 1;
          callbacks.onPauseTimeUpdate(updatedState.pauseTime);
          break;
      }

      this.timerStates.set(taskId, updatedState);
      
      // LocalStorage'a debounced save
      this.debouncedSave(taskId, updatedState);
    }, 1000);

    this.activeTimers.set(taskId, interval);
  }

  /**
   * Timer'ı durdurur ve temizler
   */
  public stopTimer(taskId: string): void {
    const interval = this.activeTimers.get(taskId);
    
    if (interval) {
      clearInterval(interval);
      this.activeTimers.delete(taskId);
    }

    // Cleanup callbacks
    this.callbacks.delete(taskId);
    
    // Also remove timer state to prevent any lingering references
    this.timerStates.delete(taskId);
  }

  /**
   * Timer status'unu günceller
   */
  public updateStatus(taskId: string, status: TimerState['status']): void {
    const state = this.timerStates.get(taskId);
    if (state) {
      const updatedState = { ...state, status };
      this.timerStates.set(taskId, updatedState);
    }
  }

  /**
   * Timer state'ini günceller
   */
  public updateState(taskId: string, newState: Partial<TimerState>): void {
    const currentState = this.timerStates.get(taskId);
    if (currentState) {
      const updatedState = { ...currentState, ...newState };
      this.timerStates.set(taskId, updatedState);
    }
  }

  /**
   * Tüm timer'ları temizler (component unmount için)
   */
  public cleanup(): void {
    this.activeTimers.forEach((interval, taskId) => {
      clearInterval(interval);
      console.log(`🧹 Cleaning up timer: ${taskId}`);
    });
    
    this.activeTimers.clear();
    this.timerStates.clear();
    this.callbacks.clear();
  }

  /**
   * Belirli bir task'ın timer'ının aktif olup olmadığını kontrol eder
   */
  public isTimerActive(taskId: string): boolean {
    return this.activeTimers.has(taskId);
  }

  /**
   * Timer state'ini alır
   */
  public getTimerState(taskId: string): TimerState | null {
    return this.timerStates.get(taskId) || null;
  }

  /**
   * Debounced localStorage save
   */
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  private debouncedSave(taskId: string, state: TimerState): void {
    // Clear existing timeout
    const existingTimeout = this.saveTimeouts.get(taskId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(`timerState_${taskId}`, JSON.stringify(state));
      } catch (error) {
        console.warn(`Failed to save timer state for ${taskId}:`, error);
      }
      this.saveTimeouts.delete(taskId);
    }, 200);

    this.saveTimeouts.set(taskId, timeout);
  }

  /**
   * LocalStorage'dan timer state'ini yükler
   */
  public loadTimerState(taskId: string): TimerState | null {
    try {
      const saved = localStorage.getItem(`timerState_${taskId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn(`Failed to load timer state for ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Timer state'ini localStorage'dan siler ve memory'den temizler
   */
  public clearTimerState(taskId: string): void {
    try {
      localStorage.removeItem(`timerState_${taskId}`);
      // Memory'den de sil
      this.timerStates.delete(taskId);
    } catch (error) {
      console.warn(`Failed to clear timer state for ${taskId}:`, error);
    }
  }
}

// Singleton instance export
export const timerService = TimerService.getInstance();

// Window unload event için cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    timerService.cleanup();
  });
}