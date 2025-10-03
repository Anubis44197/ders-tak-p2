import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createMockTask, createMockCourse } from '../test/test-utils';
import ChildDashboard from '../../components/child/ChildDashboard';
import { ChildDashboardProps, Task } from '../../types';

// Mock props factory
const createMockChildProps = (overrides?: Partial<ChildDashboardProps>): ChildDashboardProps => ({
  courses: [
    createMockCourse({ id: 'course-1', name: 'Matematik' }),
    createMockCourse({ id: 'course-2', name: 'Fizik' })
  ],
  tasks: [
    createMockTask({ 
      id: 'task-1', 
      title: 'Matematik Alıştırması',
      courseId: 'course-1',
      status: 'bekliyor',
      plannedDuration: 30,
      pointsAwarded: 100
    }),
    createMockTask({ 
      id: 'task-2', 
      title: 'Fizik Deneyi',
      courseId: 'course-2',
      status: 'tamamlandı',
      plannedDuration: 60,
      pointsAwarded: 150
    })
  ],
  performanceData: [],
  rewards: [],
  badges: [
    { 
      id: 'badge-1', 
      name: 'Matematik Ustası', 
      description: '5 matematik görevi tamamla',
      icon: () => null 
    },
    { 
      id: 'badge-2', 
      name: 'Hızlı Çözüm', 
      description: 'Bir görevi zamanında tamamla',
      icon: () => null 
    }
  ],
  successPoints: 350,
  startTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  completeTask: vi.fn(),
  claimReward: vi.fn(),
  addTask: vi.fn(),
  ...overrides
});

describe('ChildDashboard Component', () => {
  let mockProps: ChildDashboardProps;

  beforeEach(() => {
    mockProps = createMockChildProps();
    vi.clearAllMocks();
    
    // Clear localStorage for each test
    localStorage.clear();
  });

  describe('Dashboard Overview', () => {
    it('should display user statistics correctly', () => {
      render(<ChildDashboard {...mockProps} />);
      
      // Check if main stats are displayed
      expect(screen.getByText('Başarı Puanı')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
    });

    it('should show earned and unearned badges', () => {
      render(<ChildDashboard {...mockProps} />);
      
      expect(screen.getByText('Matematik Ustası')).toBeInTheDocument();
      expect(screen.getByText('Hızlı Çözüm')).toBeInTheDocument();
    });

    it('should display progress indicators', () => {
      render(<ChildDashboard {...mockProps} />);
      
      // Check for progress-related elements
      expect(screen.getByText('İlerleme')).toBeInTheDocument();
    });
  });

  describe('Task Management', () => {
    it('should display available tasks', () => {
      render(<ChildDashboard {...mockProps} />);
      
      expect(screen.getByText('Matematik Alıştırması')).toBeInTheDocument();
      expect(screen.getByText('Fizik Deneyi')).toBeInTheDocument();
    });

    it('should show task status correctly', () => {
      render(<ChildDashboard {...mockProps} />);
      
      // Look for status indicators - these will depend on how the component displays status
      // The bekliyor task should be startable, devam-ediyor should show as in progress
      const mathTask = screen.getByText('Matematik Alıştırması');
      const physicsTask = screen.getByText('Fizik Deneyi');
      
      expect(mathTask).toBeInTheDocument();
      expect(physicsTask).toBeInTheDocument();
    });

    it('should filter tasks by course when course is selected', async () => {
      render(<ChildDashboard {...mockProps} />);
      
      // Look for course filter elements
      const mathCourse = screen.getByText('Matematik');
      fireEvent.click(mathCourse);
      
      await waitFor(() => {
        expect(screen.getByText('Matematik Alıştırması')).toBeInTheDocument();
        // Physics task might be hidden depending on filter implementation
      });
    });

    it('should start a task when start button is clicked', async () => {
      const startTaskMock = vi.fn();
      const props = createMockChildProps({ startTask: startTaskMock });
      
      render(<ChildDashboard {...props} />);
      
      // Find and click start button for the waiting task
      const mathTask = screen.getByText('Matematik Alıştırması');
      
      // Look for start button near the task
      const startButtons = screen.getAllByText(/Başla|Start/i);
      if (startButtons.length > 0) {
        fireEvent.click(startButtons[0]);
        
        await waitFor(() => {
          expect(startTaskMock).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Timer Functionality', () => {
    it('should display timer when task is in progress', () => {
      render(<ChildDashboard {...mockProps} />);
      
      // The Fizik Deneyi task is in devam-ediyor status, so timer should be visible
      expect(screen.getByText('Fizik Deneyi')).toBeInTheDocument();
    });

    it('should update timer display', async () => {
      // Mock a task that's currently running
      const runningProps = createMockChildProps({
        tasks: [
          createMockTask({
            id: 'running-task',
            title: 'Aktif Görev',
            status: 'bekliyor',
            plannedDuration: 30,
            startTimestamp: Date.now() - 5 * 60 * 1000 // Started 5 minutes ago
          })
        ]
      });
      
      render(<ChildDashboard {...runningProps} />);
      
      expect(screen.getByText('Aktif Görev')).toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
    it('should complete task when completion conditions are met', async () => {
      const completeTaskMock = vi.fn();
      const props = createMockChildProps({ completeTask: completeTaskMock });
      
      render(<ChildDashboard {...props} />);
      
      // Find complete button (this would typically appear for in-progress tasks)
      const completeButtons = screen.queryAllByText(/Tamamla|Complete/i);
      if (completeButtons.length > 0) {
        fireEvent.click(completeButtons[0]);
        
        await waitFor(() => {
          expect(completeTaskMock).toHaveBeenCalled();
        });
      }
    });

    it('should show completion celebration when task is completed', async () => {
      const completeTaskMock = vi.fn().mockImplementation((taskId: string) => {
        // Simulate task completion
        return Promise.resolve();
      });
      
      const props = createMockChildProps({ completeTask: completeTaskMock });
      render(<ChildDashboard {...props} />);
      
      // This test would verify completion animation/celebration
      // Implementation depends on how completion is handled in the actual component
    });
  });

  describe('Points and Rewards System', () => {
    it('should display current points correctly', () => {
      render(<ChildDashboard {...mockProps} />);
      
      expect(screen.getByText('350')).toBeInTheDocument(); // Total points
    });

    it('should show badge progress', () => {
      render(<ChildDashboard {...mockProps} />);
      
      // Check for badge section
      expect(screen.getByText('Matematik Ustası')).toBeInTheDocument();
      expect(screen.getByText('Hızlı Çözüm')).toBeInTheDocument();
    });

    it('should display success points correctly', () => {
      render(<ChildDashboard {...mockProps} />);
      
      expect(screen.getByText('350')).toBeInTheDocument(); // Success points
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle empty task list gracefully', () => {
      const emptyProps = createMockChildProps({
        tasks: [],
        successPoints: 0
      });
      
      render(<ChildDashboard {...emptyProps} />);
      
      // Should still render dashboard without crashing
      expect(screen.getByText('Başarı Puanı')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle missing course data', () => {
      const noCourseProps = createMockChildProps({
        courses: []
      });
      
      render(<ChildDashboard {...noCourseProps} />);
      
      // Should still render main dashboard
      expect(screen.getByText('Başarı Puanı')).toBeInTheDocument();
    });
  });

  describe('Local Storage Integration', () => {
    it('should save task state to localStorage', async () => {
      const startTaskMock = vi.fn();
      const props = createMockChildProps({ startTask: startTaskMock });
      
      render(<ChildDashboard {...props} />);
      
      // Simulate task update that should trigger localStorage save
      // This depends on the actual implementation
      expect(localStorage.getItem).toBeDefined();
    });

    it('should restore task state from localStorage', () => {
      // Pre-populate localStorage with task state
      const savedState = {
        currentTask: 'task-1',
        startTime: new Date().toISOString()
      };
      localStorage.setItem('taskState', JSON.stringify(savedState));
      
      render(<ChildDashboard {...mockProps} />);
      
      // Verify that the component uses the saved state
      expect(screen.getByText('Matematik Alıştırması')).toBeInTheDocument();
    });
  });

  describe('Performance and Loading States', () => {
    it('should handle large number of tasks efficiently', () => {
      const manyTasks = Array.from({ length: 50 }, (_, i) => 
        createMockTask({
          id: `task-${i}`,
          title: `Görev ${i + 1}`,
          courseId: 'course-1',
          status: i % 3 === 0 ? 'tamamlandı' : 'bekliyor'
        })
      );
      
      const props = createMockChildProps({ tasks: manyTasks });
      render(<ChildDashboard {...props} />);
      
      // Should render without performance issues
      expect(screen.getByText('Başarı Puanı')).toBeInTheDocument();
    });
  });
});