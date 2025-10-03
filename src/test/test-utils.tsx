import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Task, Course, UserType } from '../../types';

// Test data factory functions
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'test-task-1',
  title: 'Test Görevi',
  description: 'Test açıklaması',
  courseId: 'test-course-1',
  taskType: 'soru çözme',
  status: 'bekliyor',
  dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  plannedDuration: 30,
  ...overrides,
});

export const createMockCourse = (overrides?: Partial<Course>): Course => ({
  id: 'test-course-1',
  name: 'Test Dersi',
  icon: () => null, // Mock icon component
  ...overrides,
});

// Common test data
export const mockTasks: Task[] = [
  createMockTask({
    id: 'task-1',
    title: 'Matematik Ödevi',
    status: 'tamamlandı',
    pointsAwarded: 15,
    completionDate: new Date().toISOString(),
    taskType: 'soru çözme',
    questionCount: 10,
    correctCount: 8,
  }),
  createMockTask({
    id: 'task-2', 
    title: 'Fizik Laboratuvarı',
    status: 'bekliyor',
    taskType: 'ders çalışma',
    plannedDuration: 60,
  }),
  createMockTask({
    id: 'task-3',
    title: 'Tarih Araştırması', 
    status: 'bekliyor',
    taskType: 'kitap okuma',
    bookTitle: 'Tarih Kitabı',
    pagesRead: 25,
  }),
];

export const mockCourses: Course[] = [
  createMockCourse({
    id: 'course-1',
    name: 'Matematik',
    icon: () => null,
  }),
  createMockCourse({
    id: 'course-2', 
    name: 'Fizik',
    icon: () => null,
  }),
];

// Custom render function with default props
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  // Add any global state/context providers here if needed
}

export const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  return render(ui, {
    // Add providers wrapper here if using Context API
    ...options,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };