import { useEffect, useRef } from 'react';

/**
 * Memory Leak önleme hook'u
 * Component unmount olduktan sonra state güncellemelerini engeller
 */
export const useIsUnmounted = () => {
  const isUnmounted = useRef(false);
  
  useEffect(() => {
    return () => {
      isUnmounted.current = true;
    };
  }, []);
  
  return isUnmounted;
};

/**
 * Safe setState hook'u
 * Component unmount olduysa setState çalıştırmaz
 */
export const useSafeSetState = <T>(
  setState: React.Dispatch<React.SetStateAction<T>>
) => {
  const isUnmounted = useIsUnmounted();
  
  return (value: T | ((prev: T) => T)) => {
    if (!isUnmounted.current) {
      setState(value);
    }
  };
};

/**
 * Timer ve interval'ları güvenli şekilde temizleyen hook
 */
export const useSafeTimers = () => {
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  
  const safeSetTimeout = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    
    timers.current.add(timer);
    return timer;
  };
  
  const safeSetInterval = (callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervals.current.add(interval);
    return interval;
  };
  
  const clearSafeTimeout = (timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timers.current.delete(timer);
  };
  
  const clearSafeInterval = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    intervals.current.delete(interval);
  };
  
  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(timer => clearTimeout(timer));
      intervals.current.forEach(interval => clearInterval(interval));
      timers.current.clear();
      intervals.current.clear();
    };
  }, []);
  
  return {
    safeSetTimeout,
    safeSetInterval,
    clearSafeTimeout,
    clearSafeInterval
  };
};

/**
 * Async operations için güvenli hook
 * Component unmount olduktan sonra async işlemleri iptal eder
 */
export const useSafeAsync = () => {
  const isUnmounted = useIsUnmounted();
  const abortControllers = useRef<Set<AbortController>>(new Set());
  
  const safeAsync = async <T>(
    asyncOperation: (signal: AbortSignal) => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    const controller = new AbortController();
    abortControllers.current.add(controller);
    
    try {
      const result = await asyncOperation(controller.signal);
      
      if (!isUnmounted.current && !controller.signal.aborted) {
        onSuccess?.(result);
      }
      
      return result;
    } catch (error) {
      if (!isUnmounted.current && !controller.signal.aborted) {
        onError?.(error as Error);
      }
      throw error;
    } finally {
      abortControllers.current.delete(controller);
    }
  };
  
  // Cleanup all pending operations on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
    };
  }, []);
  
  return { safeAsync };
};

/**
 * Firebase listener'ları güvenli şekilde yöneten hook
 */
export const useSafeFirebaseListener = () => {
  const unsubscribes = useRef<Set<() => void>>(new Set());
  
  const addListener = (unsubscribe: () => void) => {
    unsubscribes.current.add(unsubscribe);
    
    // Return cleanup function
    return () => {
      unsubscribe();
      unsubscribes.current.delete(unsubscribe);
    };
  };
  
  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribes.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Firebase listener cleanup error:', error);
        }
      });
      unsubscribes.current.clear();
    };
  }, []);
  
  return { addListener };
};

/**
 * Event listener'ları güvenli şekilde yöneten hook
 */
export const useSafeEventListener = () => {
  const listeners = useRef<Set<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>>(new Set());
  
  const addEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    
    const listenerInfo = { element, event, handler, options };
    listeners.current.add(listenerInfo);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(event, handler, options);
      listeners.current.delete(listenerInfo);
    };
  };
  
  // Cleanup all event listeners on unmount
  useEffect(() => {
    return () => {
      listeners.current.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn('Event listener cleanup error:', error);
        }
      });
      listeners.current.clear();
    };
  }, []);
  
  return { addEventListener };
};

export default {
  useIsUnmounted,
  useSafeSetState,
  useSafeTimers,
  useSafeAsync,
  useSafeFirebaseListener,
  useSafeEventListener
};