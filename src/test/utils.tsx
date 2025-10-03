import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Task, Course, UserType } from '../../types'

// Mock data generators
export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  courseId: 'course-1',
  taskType: 'ders çalışma',
  plannedDuration: 30,
  status: 'bekliyor',
  dueDate: new Date().toISOString().split('T')[0],
  ...overrides,
})

export const createMockCourse = (overrides?: Partial<Course>): Course => ({
  id: 'course-1',
  name: 'Test Course',
  icon: () => React.createElement('div', { children: '📚' }),
  ...overrides,
})

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return render(ui, {
    // Add providers here if needed
    ...options,
  })
}

export * from '@testing-library/react'
export { customRender as render }