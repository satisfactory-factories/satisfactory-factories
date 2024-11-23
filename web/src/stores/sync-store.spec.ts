import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, Store } from 'pinia'
import { useSyncStore } from '@/stores/sync-store'
import { useAppStore } from '@/stores/app-store'
let syncStore: Store<'sync', Pick<any, any>>
let appStore: Store<'app', Pick<any, any>>

const appStoreMock = {
  getLastEdit: vi.fn(() => new Date()),
  setFactories: vi.fn(),
}

const apiUrl = 'http://mock.com'

describe('sync-store', () => {
  beforeEach(() => {
    vi.mock('@/config/config', () => ({
      config: {
        apiUrl: 'http://mock.com', // For some reason we can't use apiUrl const directly here??
      },
    }))

    vi.mock('@/stores/auth-store', () => ({
      useAuthStore: vi.fn(() => ({
        getToken: vi.fn(() => 'mock-token'),
        validateToken: vi.fn().mockResolvedValue(true),
      })),
    }))

    vi.mock('@/stores/app-store', () => ({
      useAppStore: vi.fn(() => appStoreMock),
    }))

    // Reset mocks
    appStoreMock.getLastEdit.mockClear()
    appStoreMock.setFactories.mockClear()

    setActivePinia(createPinia()) // Initialize Pinia for each test
    syncStore = useSyncStore()
    appStore = useAppStore()
  })

  describe('getServerData', () => {
    it('should fetch valid data from the server', async () => {
      // Mock the response of fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      } as any)

      const result = await syncStore.getServerData()
      expect(result).toBe('mock-data')

      // Verify fetch was called with the correct arguments
      expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })
    it('should handle invalid data properly', async () => {
      // Mock the response of fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ someData: {} }),
      } as any)

      await expect(syncStore.getServerData()).rejects.toThrowError('Data load responded weirdly!')

      expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })
    it('should handle server errors properly', async () => {
      // Mock the response of fetch
      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        json: vi.fn().mockResolvedValue({ }),
      } as any)

      await expect(syncStore.getServerData()).rejects.toThrowError('Backend server unreachable for data load!')

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
    it('should return valid data and make the call to set factories', async () => {
      const mockData = { data: 'foo' }

      // Annoyingly for some reason it's a PITA to mock the `getServerData` function directly...
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      } as any)

      // Call the `handleDataLoad` method, which depends on the mocked `getServerData`
      const result = await syncStore.handleDataLoad()

      expect(result).toStrictEqual(true)
      expect(syncStore.getServerData).toHaveBeenCalled()
      expect(appStore.setFactories).toHaveBeenCalled()
    })
    it('should return undefined if the token is invalid', async () => {
      await expect(syncStore.handleDataLoad()).resolves.toBeUndefined()
    })
    it('should handle fetch exceptions and alert the user', async () => {
      // Mock the response of fetch
      global.fetch = vi.fn().mockImplementation(() => {
        throw new Error('Some Error')
      })

      // Mock window.alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

      await expect(syncStore.handleDataLoad()).resolves.toBeUndefined()

      // Check if alert was called with the correct message
      expect(alertMock).toHaveBeenCalledWith(
        'Unable to complete data load due to a server error. Please report the following error to Discord: Some Error'
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
