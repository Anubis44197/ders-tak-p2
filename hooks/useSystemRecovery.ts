import { useEffect, useRef, useCallback } from 'react';

// WebGL Context Recovery Hook
export const useWebGLContextRecovery = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const contextRef = useRef<WebGLRenderingContext | null>(null);
  const isContextLost = useRef(false);

  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    isContextLost.current = true;
    console.warn('WebGL context lost');
  }, []);

  const handleContextRestored = useCallback(() => {
    isContextLost.current = false;
    console.log('WebGL context restored');
    
    // Reinitialize WebGL resources here
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext('webgl') as WebGLRenderingContext || 
                          canvasRef.current.getContext('experimental-webgl') as WebGLRenderingContext;
    }
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [canvasRef, handleContextLost, handleContextRestored]);

  return { isContextLost: isContextLost.current };
};

// Performance Monitoring Hook
export const usePerformanceMonitoring = (component: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  const logPerformance = useCallback((operation: string) => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render in ${component}: ${operation} took ${renderTime.toFixed(2)}ms`);
    }

    // Log to performance buffer for analytics
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      const markName = `${component}-${operation}`;
      performance.mark(`${markName}-start`);
      performance.mark(`${markName}-end`);
      performance.measure(markName, `${markName}-start`, `${markName}-end`);
    }
  }, [component]);

  return { logPerformance, renderCount: renderCount.current };
};

// Service Worker Registration Hook
export const useServiceWorkerRegistration = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          registrationRef.current = registration;
          console.log('Service Worker registered:', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (window.confirm('Yeni bir güncelleme mevcut. Uygulamayı yeniden başlatmak ister misiniz?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case 'CACHE_UPDATE':
              console.log('Cache updated:', event.data.url);
              break;
            case 'OFFLINE_MODE':
              console.log('App is now in offline mode');
              break;
          }
        }
      });
    }
  }, []);

  return registrationRef.current;
};

// IndexedDB Error Recovery Hook
export const useIndexedDBRecovery = () => {
  const dbRef = useRef<IDBDatabase | null>(null);

  const openDB = useCallback(async (dbName: string, version: number = 1) => {
    try {
      const request = indexedDB.open(dbName, version);
      
      return new Promise<IDBDatabase>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          dbRef.current = request.result;
          resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('tasks')) {
            db.createObjectStore('tasks', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('courses')) {
            db.createObjectStore('courses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('analytics')) {
            db.createObjectStore('analytics', { keyPath: 'date' });
          }
        };
      });
    } catch (error) {
      console.error('IndexedDB open failed:', error);
      throw error;
    }
  }, []);

  const recoverDB = useCallback(async (dbName: string) => {
    try {
      // Try to delete and recreate corrupted database
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Reopen database
      return await openDB(dbName);
    } catch (error) {
      console.error('IndexedDB recovery failed:', error);
      throw error;
    }
  }, [openDB]);

  return { openDB, recoverDB, db: dbRef.current };
};

// App State Recovery Hook
export const useAppStateRecovery = () => {
  const saveAppState = useCallback((state: any) => {
    try {
      const stateString = JSON.stringify(state);
      sessionStorage.setItem('app_state_backup', stateString);
      localStorage.setItem('app_state_persistent', stateString);
    } catch (error) {
      console.error('Failed to save app state:', error);
    }
  }, []);

  const recoverAppState = useCallback(() => {
    try {
      // Try session storage first (temporary)
      let stateString = sessionStorage.getItem('app_state_backup');
      
      // Fall back to localStorage (persistent)
      if (!stateString) {
        stateString = localStorage.getItem('app_state_persistent');
      }

      if (stateString) {
        return JSON.parse(stateString);
      }
    } catch (error) {
      console.error('Failed to recover app state:', error);
    }
    return null;
  }, []);

  const clearAppState = useCallback(() => {
    try {
      sessionStorage.removeItem('app_state_backup');
      localStorage.removeItem('app_state_persistent');
    } catch (error) {
      console.error('Failed to clear app state:', error);
    }
  }, []);

  return { saveAppState, recoverAppState, clearAppState };
};

// Network Recovery Hook
export const useNetworkRecovery = () => {
  const isOnline = useRef(navigator.onLine);
  const retryQueue = useRef<Array<() => Promise<any>>>([]);

  const addToRetryQueue = useCallback((operation: () => Promise<any>) => {
    retryQueue.current.push(operation);
  }, []);

  const processRetryQueue = useCallback(async () => {
    if (!isOnline.current || retryQueue.current.length === 0) return;

    const operations = [...retryQueue.current];
    retryQueue.current = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Retry operation failed:', error);
        // Add back to queue for next attempt
        retryQueue.current.push(operation);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true;
      console.log('Network connection restored');
      processRetryQueue();
    };

    const handleOffline = () => {
      isOnline.current = false;
      console.log('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processRetryQueue]);

  return { 
    isOnline: isOnline.current, 
    addToRetryQueue, 
    queueSize: retryQueue.current.length 
  };
};