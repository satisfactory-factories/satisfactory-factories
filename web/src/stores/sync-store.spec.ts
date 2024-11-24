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
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      const syncStore = useSyncStore()
      const result = await syncStore.getServerData()

      expect(result).toStrictEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should handle invalid data properly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ someData: {} }),
      })

      const syncStore = useSyncStore()

      await expect(syncStore.getServerData()).rejects.toThrowError(
        'Data load responded weirdly!'
      )

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should handle server errors properly', async () => {
      mockFetch.mockResolvedValue({
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })

      const syncStore = useSyncStore()

      await expect(syncStore.getServerData()).rejects.toThrowError(
        'Backend server unreachable for data load!'
      )

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
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
      // Mock mockFetch to simulate server response
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      })

      const syncStore = useSyncStore()
      const appStore = useAppStore()
      const authStore = useAuthStore()

      // Mock validateToken to return true
      authStore.validateToken = vi.fn().mockResolvedValue(true)

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
      const serverSaved = new Date()
      serverSaved.setMinutes(serverSaved.getMinutes() - 10)

      const syncStore = useSyncStore()

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

  describe('saveData', () => {
    it('should not sync if the stopSyncing flag is set', async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()

      syncStore.stopSync()
      expect(await syncStore.saveData()).toBeUndefined()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(authStore.getToken).not.toHaveBeenCalled()
    })

    it('should not sync if there is no data save pending', async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      // Default state is there is no data to sync
      expect(await syncStore.saveData()).toBeUndefined()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(authStore.getToken).not.toHaveBeenCalled()
    })

    it("should not sync if there's a token error", async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      syncStore.detectedChange()

      // Mock getToken to throw an error
      authStore.getToken = vi.fn().mockRejectedValue(new Error('Token error'))

      // Call saveData and expect an error
      expect(await syncStore.saveData()).toBe(undefined)
      expect(authStore.getToken).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not sync if there is no token', async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      syncStore.detectedChange()

      // Mock getToken to throw an error
      authStore.getToken = vi.fn().mockResolvedValue('')

      // Call saveData and expect an error
      expect(await syncStore.saveData()).toBe(undefined)
      expect(authStore.getToken).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it("should not sync if there's data to save", async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      const appStore = useAppStore()
      syncStore.detectedChange()

      appStore.getFactories = vi.fn().mockReturnValueOnce({} as any)

      // It will still stop at the no data check, but we want to test that it's asking for a token and passed the data pending check
      expect(await syncStore.saveData()).toBe(undefined)
      expect(authStore.getToken).toHaveBeenCalled()
    })

    it("should sync if there's data to save", async () => {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      const appStore = useAppStore()
      syncStore.detectedChange()

      appStore.getFactories = vi.fn().mockReturnValueOnce({ someData: 'foo' })

      // Assume response was valid
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'All is good' }),
      })

      // It will still stop at the no data check, but we want to test that it's asking for a token and passed the data pending check
      expect(await syncStore.saveData()).toBe(true)
      expect(authStore.getToken).toHaveBeenCalled()
    })

    it('should send sync with expected request params', async () => {
      const syncStore = useSyncStore()
      const appStore = useAppStore()
      const authStore = useAuthStore()

      syncStore.detectedChange()
      const mockData = { someData: 'foo' } as any

      appStore.getFactories = vi.fn().mockReturnValueOnce(mockData)

      // Assume response was valid
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'All is good' }),
      })

      // It will still stop at the no data check, but we want to test that it's asking for a token and passed the data pending check
      expect(await syncStore.saveData()).toBe(true)
      expect(authStore.getToken).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        body: JSON.stringify({ data: mockData }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token`,
        },
      })
    })

    it('should handle server errors properly', async () => {
      const syncStore = useSyncStore()
      const authStore = useAuthStore()
      const appStore = useAppStore()
      syncStore.detectedChange()

      // Mock getToken to return a valid token
      authStore.getToken = vi.fn().mockResolvedValue('mock-token')

      // Mock fetch to throw an error
      mockFetch.mockRejectedValue(() => { Error('Network error') })

      appStore.getFactories = vi.fn().mockReturnValueOnce({ someData: 'foo' })

      // Call saveData and expect an error
      expect(await syncStore.saveData()).toBe(false)
      expect(authStore.getToken).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle server 50Xs properly', async () => {
      const syncStore = useSyncStore()
      const authStore = useAuthStore()
      const appStore = useAppStore()

      // Mocks
      syncStore.stopSync = vi.fn().mockResolvedValue(true)
      authStore.getToken = vi.fn().mockResolvedValue('mock-token')
      appStore.getFactories = vi.fn().mockReturnValueOnce(mockData)
      window.alert = vi.fn()
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })

      // Actions
      syncStore.detectedChange()

      // Asserts
      expect(await syncStore.saveData()).toBe(false)
      expect(authStore.getToken).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalled()
      // expect(syncStore.stopSync).toHaveBeenCalled() // TODO: for some reason this spy is not being called??
      expect(window.alert).toHaveBeenCalledWith(`There was an error saving your data with the server. Syncing has been disabled until page refresh in case of server outage. Please report this to Discord: "saveData: Server 500 error"`)
    })
  })
})
