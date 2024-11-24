import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncStore } from '@/stores/sync-store'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'

let syncStore: ReturnType<typeof useSyncStore>
let appStore: ReturnType<typeof useAppStore>
let authStore: ReturnType<typeof useAuthStore>

const apiUrl = 'http://mock.com'
const mockData = { data: 'mock-data' }
let mockFetch: ReturnType<typeof vi.fn>

const mockAuthStore = {
  getToken: vi.fn().mockResolvedValue('mock-token'),
  validateToken: vi.fn().mockResolvedValue(true),
}

const mockAppStore = {
  setFactories: vi.fn(),
  getLastEdit: vi.fn(() => new Date()),
  getFactories: vi.fn(() => ({ someData: 'test' })),
}

describe('sync-store', () => {
  beforeEach(async () => {
    // Clear all modules and mocks
    vi.resetModules()

    // Mock auth store with default behavior
    vi.doMock('@/stores/auth-store', () => ({
      useAuthStore: vi.fn(() => mockAuthStore),
    }))
    vi.doMock('@/stores/app-store', () => ({
      useAppStore: vi.fn(() => mockAppStore),
    }))
    vi.mock('@/config/config', () => ({
      config: {
        apiUrl: 'http://mock.com',
        dataVersion: '1.0.0',
      },
    }))

    // Create a fresh Pinia instance for testing
    const { createTestingPinia } = await import('@pinia/testing')
    const { useSyncStore } = await import('@/stores/sync-store')
    const { useAppStore } = await import('@/stores/app-store')
    const { useAuthStore } = await import('@/stores/auth-store')

    const testingPinia = createTestingPinia({
      stubActions: false, // Allow actions to run their original implementation
    })

    // Create a mock fetch function
    mockFetch = vi.fn()

    // Initialize the stores dynamically
    syncStore = useSyncStore(mockAuthStore, mockAppStore)
    appStore = useAppStore(testingPinia)
    authStore = useAuthStore(mockFetch)
  })

  describe('getServerData', () => {
    it('should fetch valid data from the server', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as any)

      const result = await syncStore.getServerData()

      expect(result).toStrictEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should handle invalid data properly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ someData: {} }),
      } as any)

      await expect(syncStore.getServerData()).rejects.toThrowError(
        'Data load responded weirdly!'
      )

      expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should handle server errors properly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      } as any)

      await expect(syncStore.getServerData()).rejects.toThrowError(
        'Backend server unreachable for data load!'
      )

      expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })
  })

  describe('handleDataLoad', () => {
    it('should return valid data and make the call to setFactories', async () => {
      // Mock global.fetch to simulate server response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      } as any)

      // Mock validateToken to return true
      authStore.validateToken = vi.fn().mockResolvedValue(true)

      // Call handleDataLoad
      const result = await syncStore.handleDataLoad()

      // Assertions
      expect(result).toStrictEqual(true)
      expect(appStore.setFactories).toHaveBeenCalledWith('mock-data')
    })

    it('should return undefined if the token is invalid', async () => {
      // Mock validateToken to return false
      authStore.validateToken = vi.fn().mockResolvedValue(false)

      // Call handleDataLoad and expect undefined
      await expect(syncStore.handleDataLoad()).resolves.toBeUndefined()
    })
  })

  describe('checkOOS', () => {
    it('should detect when in sync', () => {
      const serverSaved = new Date()
      serverSaved.setMinutes(serverSaved.getMinutes() - 10)

      const result = syncStore.checkForOOS({
        lastSaved: serverSaved,
      } as any)

      expect(result).toBe(false)
    })

    it('should detect out-of-sync data', () => {
      const serverSaved = new Date()
      serverSaved.setMinutes(serverSaved.getMinutes() + 10)

      const result = syncStore.checkForOOS({
        lastSaved: serverSaved,
      } as any)

      expect(result).toBe(true)
    })
  })
})
