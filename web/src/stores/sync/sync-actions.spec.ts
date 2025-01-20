import { SyncActions } from '@/stores/sync/sync-actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { newTab } from '@/utils/plannerStateManagement'
import { BackendPlannerStateResponse } from '@/interfaces/BackendPlannerStateResponse'

const apiUrl = 'http://mock.com'
const mockData = { data: 'mock-data' }
const mockFetch = vi.fn()

// Mock configuration
vi.mock('@/config/config', () => ({
  config: {
    apiUrl: 'http://mock.com',
    dataVersion: '1.0.0',
  },
}))

// Mock stores
const mockAuthStore = {
  getToken: vi.fn().mockResolvedValue('mock-token'),
  validateToken: vi.fn().mockResolvedValue(true),
}

const mockAppStore = {
  getLastEdit: vi.fn(() => new Date(Date.now() - 1000 * 60)), // 1 minute ago
  getFactories: vi.fn(),
  setFactories: vi.fn(),
  getTabs: vi.fn(),
  setTabs: vi.fn(),
  isLoaded: true,
}

const mockTab = newTab({ name: 'Foo1' })
const mockServerData: BackendPlannerStateResponse = {
  user: 'foo',
  currentTabId: mockTab.id,
  tabs: [mockTab],
  userOptions: [],
  lastSaved: new Date(),
  lastEdited: new Date(),
}

describe('SyncActions', () => {
  let syncActions: SyncActions

  beforeEach(() => {
    // Initialize the mock global fetch
    global.fetch = mockFetch

    // Reset mocks
    vi.clearAllMocks()

    // Instantiate SyncActions with mock stores
    syncActions = new SyncActions(mockAuthStore, mockAppStore)
  })

  describe('getServerData', () => {
    it('should fetch valid data from the server', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      const result = await syncActions.getServerData()

      expect(result).toStrictEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/load`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should handle request errors properly', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('Network error')
      })

      await expect(syncActions.getServerData()).rejects.toThrowError('Network error')
    })

    it('should handle server errors properly', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(syncActions.getServerData()).rejects.toThrowError(
        'Backend server unreachable for migration check!'
      )

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/needsStateMigration`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      })
    })

    it('should perform a state migration', async () => {
      vi.spyOn(syncActions, 'checkIfNeedsMigration').mockResolvedValue(true)
      vi.spyOn(mockAppStore, 'getTabs').mockReturnValue({ someData: 'foo' })

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      })

      const result = await syncActions.getServerData()

      expect(result).toStrictEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token`,
        },
        body: JSON.stringify({ someData: 'foo' }),
      })
    })
  })

  describe('loadServerData', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks()
      vi.spyOn(mockAuthStore, 'validateToken').mockResolvedValue(true)
    })
    it('should fetch and do nothing when OOS is false', async () => {
      vi.spyOn(syncActions, 'getServerData').mockResolvedValue(mockServerData)
      vi.spyOn(syncActions, 'checkForOOS').mockReturnValue(false)

      await syncActions.loadServerData()
      expect(syncActions.getServerData).toHaveBeenCalledTimes(1)
      expect(mockAppStore.setFactories).not.toHaveBeenCalled()
    })
    it('should fetch and do nothing when no data detected', async () => {
      vi.spyOn(syncActions, 'getServerData').mockRejectedValue(new Error('No data'))

      expect(await syncActions.loadServerData()).toBe(undefined)
      expect(mockAppStore.setFactories).not.toHaveBeenCalled()
    })

    it('should return "oos" when out-of-sync data is detected and is not force loaded', async () => {
      vi.spyOn(syncActions, 'getServerData').mockResolvedValue(mockServerData)
      vi.spyOn(syncActions, 'checkForOOS').mockReturnValue(true)

      const result = await syncActions.loadServerData()
      expect(result).toBe('oos')
    })

    it('should return undefined if the token is invalid', async () => {
      mockAuthStore.validateToken.mockResolvedValue(false)

      const result = await syncActions.loadServerData()
      expect(result).toBeUndefined()
    })

    it('should correctly force load the factory tabs into appStore', async () => {
      const mockData = {
        user: 'foo',
        currentTabId: 'foo',
        tabs: [
          newTab({ name: 'Foo1' }),
          newTab({ name: 'Foo2' }),
        ],
        lastSaved: new Date(),
        lastEdited: new Date(),
        userOptions: [],
      }

      vi.spyOn(syncActions, 'getServerData').mockResolvedValue(mockData)
      vi.spyOn(syncActions, 'checkForOOS').mockReturnValue(true)

      expect(await syncActions.loadServerData(true)).toBe(true)
      expect(mockAppStore.setTabs).toHaveBeenCalledWith(mockData.tabs)
    })
  })

  describe('syncData', () => {
    it('should not sync if stopSyncing is true', async () => {
      await syncActions.syncData(true, true)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not sync if dataSavePending is false', async () => {
      await syncActions.syncData(false, false)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should send sync with expected request params', async () => {
      mockAppStore.getFactories.mockReturnValueOnce({ someData: 'foo' })

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'All is good' }),
      })

      // Mock that the app store is ready
      mockAppStore.isLoaded = true

      const result = await syncActions.syncData(false, true)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock-token`,
        },
        body: JSON.stringify({ someData: 'foo' }),
      })
    })

    it('should handle server errors during sync', async () => {
      mockAppStore.getFactories.mockReturnValueOnce({ someData: 'foo' })

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })

      await expect(syncActions.syncData(false, true)).rejects.toThrowError(
        'syncData: Server 5xx error'
      )

      expect(mockFetch).toHaveBeenCalled()
    })
  })

  describe('checkForOOS', () => {
    it('should detect when server data is behind local (not OOS)', () => {
      const mockData = {
        lastSaved: new Date(Date.now() - 2000 * 60), // 2 minutes ago
      }

      // Apply mocks
      mockAppStore.getLastEdit = vi.fn().mockReturnValue(new Date()) // Now
      syncActions = new SyncActions(mockAuthStore, mockAppStore)

      const result = syncActions.checkForOOS(mockData as any)
      expect(result).toBe(false)
    })

    it('should detect when server data is ahead of local (potential OOS)', () => {
      const mockData = {
        lastSaved: new Date(), // Now
      }

      // Apply mocks
      mockAppStore.getLastEdit = vi.fn().mockReturnValue(new Date(Date.now() - 2000 * 60)) // 2 mins ago
      syncActions = new SyncActions(mockAuthStore, mockAppStore)

      const result = syncActions.checkForOOS(mockData as any)
      expect(result).toBe(true)
    })
  })
  describe('performSave', () => {
    let data: any
    beforeEach(() => {
      data = { someData: 'foo' }
      mockAuthStore.getToken.mockResolvedValueOnce('foo')
    })
    it('should throw if there is no token', () => {
      mockAuthStore.getToken.mockResolvedValueOnce(null)
      expect(syncActions.performSave({} as any)).rejects.toThrowError('syncData: performSave: No token!')
    })

    it('should abort if there is no data', () => {
      expect(syncActions.performSave({} as any)).resolves.toBe(undefined)
    })

    it('should perform a save with proper data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ message: 'All is good' }),
      })

      await syncActions.performSave(data as any)

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer foo`,
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle server exceptions', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('Network error')
      })

      await expect(
        syncActions.performSave(data as any)
      ).rejects.toThrow(`syncData: performSave: Unexpected Response - Network error`)

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer foo`,
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle not ok responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Something went bang' }),
      })

      await expect(
        syncActions.performSave(data as any)
      ).rejects.toThrow(`syncData: performSave: Server 5xx error`)

      expect(mockFetch).toHaveBeenCalledWith(`${apiUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer foo`,
        },
        body: JSON.stringify(data),
      })
    })
  })
})
