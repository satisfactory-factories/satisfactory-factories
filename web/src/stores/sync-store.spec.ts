import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { useSyncStore } from '@/stores/sync-store'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiUrl = 'http://mock.com'
const mockData = { data: 'mock-data' }
const mockFetch = vi.fn()

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(),
}))

vi.mock('@/config/config', () => ({
  config: {
    apiUrl: 'http://mock.com',
    dataVersion: '1.0.0',
  },
}))

describe('sync-store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    global.fetch = mockFetch

    const mockAuthStore = {
      getToken: vi.fn(() => 'mock-token'),
      validateToken: vi.fn(() => true),
    }

    const mockAppStore = {
      setFactories: vi.fn(),
      getLastEdit: vi.fn(() => new Date()),
    }

    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any)
    vi.mocked(useAppStore).mockReturnValue(mockAppStore as any)
  })

  describe('getServerData', () => {
    it('should fetch valid data from the server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      const syncStore = useSyncStore()

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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ someData: {} }),
      })

      const syncStore = useSyncStore()

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
      mockFetch.mockResolvedValueOnce({
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })

      const syncStore = useSyncStore()

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      })

      const syncStore = useSyncStore()
      const appStore = useAppStore()

      // Call handleDataLoad
      const result = await syncStore.handleDataLoad()

      // Assertions
      expect(result).toStrictEqual(true)
      expect(appStore.setFactories).toHaveBeenCalledWith('mock-data')
    })

    it('should return undefined if the token is invalid', async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()

      // Mock validateToken to return false
      authStore.validateToken = vi.fn().mockResolvedValue(false)

      // Call handleDataLoad and expect undefined
      await expect(syncStore.handleDataLoad()).resolves.toBeUndefined()
    })
  })

  describe('checkOOS', () => {
    it('should detect when in sync', () => {
      const syncStore = useSyncStore()

      const serverSaved = new Date()
      serverSaved.setMinutes(serverSaved.getMinutes() - 10)

      const result = syncStore.checkForOOS({
        lastSaved: serverSaved,
      } as any)

      expect(result).toBe(false)
    })

    it('should detect out-of-sync data', () => {
      const syncStore = useSyncStore()

      const serverSaved = new Date(new Date().getTime() + 1000)
      serverSaved.setMinutes(serverSaved.getMinutes() + 10)

      const result = syncStore.checkForOOS({
        lastSaved: serverSaved,
      } as any)

      expect(result).toBe(true)
    })
  })
})
