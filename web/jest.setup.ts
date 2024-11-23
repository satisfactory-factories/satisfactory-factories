import { jest } from '@jest/globals'

const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    length: 0, // Mocked length property
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})
