import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { createPinia, setActivePinia } from 'pinia'
import { useSyncStore } from '@/stores/sync-store'

jest.mock('@/config/config', () => ({
  config: {
    apiUrl: 'http://mocked-api-url.com',
  },
}))

jest.mock('@/stores/app-store', () => ({
  useAppStore: jest.fn(), // Mock the function itself
}))

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    getToken: jest.fn(() => 'mock-token'),
  })),
}))

jest.mock('@/stores/app-store', () => ({
  useAppStore: jest.fn(() => ({
    getLastEdit: jest.fn(() => new Date()),
    setFactories: jest.fn(),
  })),
}))

describe('sync-store tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia()) // Initialize Pinia for each test
  })

  it('should detect out-of-sync data', () => {
    const syncStore = useSyncStore()
    const lastSavedDate = new Date()
    lastSavedDate.setMinutes(lastSavedDate.getMinutes() - 1)

    // Mock checkForOOS behavior
    const result = syncStore.checkForOOS({
      lastSaved: lastSavedDate,
    } as any)

    expect(result).toBe(true)
  })
})
