import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Test cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock implementations - localStorage with actual storage behavior for tests
const storage: { [key: string]: string } = {}

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      for (const key in storage) {
        delete storage[key]
      }
    }),
    length: 0,
    key: vi.fn()
  },
  writable: true,
})

// Mock Google AI API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContentStream: vi.fn().mockResolvedValue({
        stream: {
          async *[Symbol.asyncIterator]() {
            yield { text: () => 'Mocked AI response' }
          }
        }
      })
    })
  }))
}))

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_GOOGLE_AI_API_KEY: 'mock-api-key'
  },
  writable: true,
})

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))