import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, Store } from 'pinia'
import { useSyncStore } from '@/stores/sync-store'
let syncStore: Store<'sync', Pick<any, any>>

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

describe('sync-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia()) // Initialize Pinia for each test
    syncStore = useSyncStore()
  })

  describe('getServerData', () => {
    it('should fetch data from the server', async () => {
      const response = {
        ok: true,
        json: jest.fn(() => ({ data: 'mock-data' })),
      }
      global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>
      global.fetch.mockResolvedValue(response as any)
      const result = await syncStore.getServerData()

      expect(result).toBe('mock-data')
    })
  })

  describe('handleDataLoad', () => {

  })

  describe('checkOOS', () => {
    it('should detect out-of-sync data', () => {
      const lastSavedDate = new Date()
      lastSavedDate.setMinutes(lastSavedDate.getMinutes() - 1)

      const result = syncStore.checkForOOS({
        lastSaved: lastSavedDate,
      } as any)

      expect(result).toBe(true)
    })
  })
})
