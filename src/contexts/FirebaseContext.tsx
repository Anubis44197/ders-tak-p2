import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Task, Course, Reward, Badge } from '../../types';

interface FirebaseContextType {
  // Data
  tasks: Task[];
  courses: Course[];
  rewards: Reward[];
  badges: Badge[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addCourse: (courseName: string) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Unsubscribe functions for cleanup
  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([]);

  // Initialize Firebase listeners
  useEffect(() => {
    const newUnsubscribes: Unsubscribe[] = [];
    
    try {
      // Tasks listener
      const tasksUnsubscribe = onSnapshot(
        query(collection(db, 'tasks'), orderBy('dueDate', 'asc')),
        (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Task));
          setTasks(tasksData);
        },
        (error) => {
          console.error('Tasks listener error:', error);
          setError('Görevler yüklenirken hata oluştu');
        }
      );
      newUnsubscribes.push(tasksUnsubscribe);

      // Courses listener
      const coursesUnsubscribe = onSnapshot(
        collection(db, 'courses'),
        (snapshot) => {
          const coursesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Course));
          setCourses(coursesData);
        },
        (error) => {
          console.error('Courses listener error:', error);
          setError('Dersler yüklenirken hata oluştu');
        }
      );
      newUnsubscribes.push(coursesUnsubscribe);

      // Rewards listener
      const rewardsUnsubscribe = onSnapshot(
        collection(db, 'rewards'),
        (snapshot) => {
          const rewardsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Reward));
          setRewards(rewardsData);
        },
        (error) => {
          console.error('Rewards listener error:', error);
          setError('Ödüller yüklenirken hata oluştu');
        }
      );
      newUnsubscribes.push(rewardsUnsubscribe);

      // Badges listener
      const badgesUnsubscribe = onSnapshot(
        collection(db, 'badges'),
        (snapshot) => {
          const badgesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Badge));
          setBadges(badgesData);
        },
        (error) => {
          console.error('Badges listener error:', error);
          setError('Rozetler yüklenirken hata oluştu');
        }
      );
      newUnsubscribes.push(badgesUnsubscribe);

      setUnsubscribes(newUnsubscribes);
      setLoading(false);
      
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setError('Veritabanı bağlantısı kurulamadı');
      setLoading(false);
    }

    // Cleanup function
    return () => {
      newUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Actions
  const addTask = async (taskData: Omit<Task, 'id' | 'status'>): Promise<Task> => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        status: 'bekliyor',
        createdAt: new Date().toISOString()
      });
      
      const newTask = {
        id: docRef.id,
        ...taskData,
        status: 'bekliyor' as const
      };
      
      return newTask;
    } catch (error) {
      console.error('Add task error:', error);
      throw new Error('Görev eklenirken hata oluştu');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updates);
    } catch (error) {
      console.error('Update task error:', error);
      throw new Error('Görev güncellenirken hata oluştu');
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Delete task error:', error);
      throw new Error('Görev silinirken hata oluştu');
    }
  };

  const addCourse = async (courseName: string): Promise<void> => {
    try {
      await addDoc(collection(db, 'courses'), {
        name: courseName,
        icon: 'BookOpen', // Default icon
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Add course error:', error);
      throw new Error('Ders eklenirken hata oluştu');
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (error) {
      console.error('Delete course error:', error);
      throw new Error('Ders silinirken hata oluştu');
    }
  };

  const addReward = async (rewardData: Omit<Reward, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(db, 'rewards'), {
        ...rewardData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Add reward error:', error);
      throw new Error('Ödül eklenirken hata oluştu');
    }
  };

  const deleteReward = async (rewardId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'rewards', rewardId));
    } catch (error) {
      console.error('Delete reward error:', error);
      throw new Error('Ödül silinirken hata oluştu');
    }
  };

  const contextValue: FirebaseContextType = {
    // Data
    tasks,
    courses,
    rewards,
    badges,
    
    // States
    loading,
    error,
    
    // Actions
    addTask,
    updateTask,
    deleteTask,
    addCourse,
    deleteCourse,
    addReward,
    deleteReward
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider;