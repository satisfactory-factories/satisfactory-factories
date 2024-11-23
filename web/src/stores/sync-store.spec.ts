import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSyncStore } from '@/stores/sync-store'

vi.mock('@/config/config', () => ({
  config: {
    apiUrl: 'http://mocked-api-url.com',
  },
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(), // Mock the function itself
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    getToken: vi.fn(() => 'mock-token'),
  })),
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(() => ({
    getLastEdit: vi.fn(() => new Date()),
    setFactories: vi.fn(),
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
