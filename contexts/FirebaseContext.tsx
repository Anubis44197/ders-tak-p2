import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Task, Course, Reward, Badge, PerformanceData } from '../types';

// Firebase Context interface
interface FirebaseContextType {
  // Data state
  tasks: Task[];
  courses: Course[];
  rewards: Reward[];
  badges: Badge[];
  performanceData: PerformanceData[];
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // CRUD operations
  addTask: (task: Omit<Task, 'id'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  addCourse: (course: Omit<Course, 'id'>) => Promise<string>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  
  addReward: (reward: Omit<Reward, 'id'>) => Promise<string>;
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  
  addBadge: (badge: Omit<Badge, 'id'>) => Promise<string>;
  updateBadge: (badgeId: string, updates: Partial<Badge>) => Promise<void>;
  deleteBadge: (badgeId: string) => Promise<void>;
  
  // Performance data
  updatePerformanceData: (courseId: string, updates: Partial<PerformanceData>) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// Create context
const FirebaseContext = createContext<FirebaseContextType | null>(null);

// Error handling helper
const handleFirestoreError = (error: FirestoreError): string => {
  console.error('Firestore error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      return 'İzin reddedildi. Lütfen giriş yapın.';
    case 'unavailable':
      return 'Veritabanına bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
    case 'not-found':
      return 'Aranan veri bulunamadı.';
    case 'already-exists':
      return 'Bu kayıt zaten mevcut.';
    case 'resource-exhausted':
      return 'Günlük kullanım limiti aşıldı.';
    default:
      return `Bir hata oluştu: ${error.message}`;
  }
};

// Provider component
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Setup real-time listeners
  useEffect(() => {
    setLoading(true);
    setConnectionStatus('connecting');

    // Tasks listener
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        try {
          const tasksData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Convert Firestore timestamps to numbers if needed
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
              completionTimestamp: data.completionTimestamp instanceof Timestamp ? data.completionTimestamp.toMillis() : data.completionTimestamp,
              startTimestamp: data.startTimestamp instanceof Timestamp ? data.startTimestamp.toMillis() : data.startTimestamp,
            } as Task;
          });
          setTasks(tasksData);
          setConnectionStatus('connected');
        } catch (err) {
          console.error('Error processing tasks:', err);
          setError('Görevler yüklenirken hata oluştu.');
        }
      },
      (error) => {
        setError(handleFirestoreError(error as FirestoreError));
        setConnectionStatus('disconnected');
      }
    );

    // Courses listener
    const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribeCourses = onSnapshot(
      coursesQuery,
      (snapshot) => {
        try {
          const coursesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Course));
          setCourses(coursesData);
        } catch (err) {
          console.error('Error processing courses:', err);
          setError('Dersler yüklenirken hata oluştu.');
        }
      },
      (error) => {
        setError(handleFirestoreError(error as FirestoreError));
      }
    );

    // Rewards listener
    const rewardsQuery = query(collection(db, 'rewards'), orderBy('createdAt', 'desc'));
    const unsubscribeRewards = onSnapshot(
      rewardsQuery,
      (snapshot) => {
        try {
          const rewardsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Reward));
          setRewards(rewardsData);
        } catch (err) {
          console.error('Error processing rewards:', err);
          setError('Ödüller yüklenirken hata oluştu.');
        }
      },
      (error) => {
        setError(handleFirestoreError(error as FirestoreError));
      }
    );

    // Badges listener
    const badgesQuery = query(collection(db, 'badges'), orderBy('createdAt', 'desc'));
    const unsubscribeBadges = onSnapshot(
      badgesQuery,
      (snapshot) => {
        try {
          const badgesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Badge));
          setBadges(badgesData);
        } catch (err) {
          console.error('Error processing badges:', err);
          setError('Rozetler yüklenirken hata oluştu.');
        }
      },
      (error) => {
        setError(handleFirestoreError(error as FirestoreError));
      }
    );

    // Performance data listener
    const performanceQuery = query(collection(db, 'performance'), orderBy('courseId'));
    const unsubscribePerformance = onSnapshot(
      performanceQuery,
      (snapshot) => {
        try {
          const performanceDataArr = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              courseId: data.courseId || '',
              courseName: data.courseName || '',
              correct: data.correct || 0,
              incorrect: data.incorrect || 0,
              timeSpent: data.timeSpent || 0,
              ...data
            } as PerformanceData;
          });
          setPerformanceData(performanceDataArr);
        } catch (err) {
          console.error('Error processing performance data:', err);
          setError('Performans verileri yüklenirken hata oluştu.');
        }
      },
      (error) => {
        setError(handleFirestoreError(error as FirestoreError));
      }
    );

    // Set loading to false after initial setup
    setTimeout(() => setLoading(false), 1000);

    // Cleanup function
    return () => {
      unsubscribeTasks();
      unsubscribeCourses();
      unsubscribeRewards();
      unsubscribeBadges();
      unsubscribePerformance();
    };
  }, []);

  // Task CRUD operations
  const addTask = useCallback(async (task: Omit<Task, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Course CRUD operations
  const addCourse = useCallback(async (course: Omit<Course, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...course,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<Course>): Promise<void> => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteCourse = useCallback(async (courseId: string): Promise<void> => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await deleteDoc(courseRef);
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Reward CRUD operations
  const addReward = useCallback(async (reward: Omit<Reward, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'rewards'), {
        ...reward,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateReward = useCallback(async (rewardId: string, updates: Partial<Reward>): Promise<void> => {
    try {
      const rewardRef = doc(db, 'rewards', rewardId);
      await updateDoc(rewardRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteReward = useCallback(async (rewardId: string): Promise<void> => {
    try {
      const rewardRef = doc(db, 'rewards', rewardId);
      await deleteDoc(rewardRef);
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Badge CRUD operations
  const addBadge = useCallback(async (badge: Omit<Badge, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'badges'), {
        ...badge,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateBadge = useCallback(async (badgeId: string, updates: Partial<Badge>): Promise<void> => {
    try {
      const badgeRef = doc(db, 'badges', badgeId);
      await updateDoc(badgeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteBadge = useCallback(async (badgeId: string): Promise<void> => {
    try {
      const badgeRef = doc(db, 'badges', badgeId);
      await deleteDoc(badgeRef);
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Performance data operations
  const updatePerformanceData = useCallback(async (courseId: string, updates: Partial<PerformanceData>): Promise<void> => {
    try {
      const performanceRef = doc(db, 'performance', courseId);
      await updateDoc(performanceRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      const errorMessage = handleFirestoreError(error as FirestoreError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh data manually
  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Listeners will automatically refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      setConnectionStatus('connected');
    } catch (error) {
      setError('Veriler yenilenirken hata oluştu.');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue: FirebaseContextType = {
    // Data
    tasks,
    courses,
    rewards,
    badges,
    performanceData,
    
    // State
    loading,
    error,
    connectionStatus,
    
    // CRUD operations
    addTask,
    updateTask,
    deleteTask,
    addCourse,
    updateCourse,
    deleteCourse,
    addReward,
    updateReward,
    deleteReward,
    addBadge,
    updateBadge,
    deleteBadge,
    updatePerformanceData,
    
    // Utilities
    clearError,
    refreshData,
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Hook to use Firebase context
export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase hook must be used within a FirebaseProvider');
  }
  return context;
};

export default FirebaseContext;