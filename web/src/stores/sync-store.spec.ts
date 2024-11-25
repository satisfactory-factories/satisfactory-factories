import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncStore } from '@/stores/sync-store'
import eventBus from '@/utils/eventBus'

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    validateToken: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(() => ({
    setFactories: vi.fn(),
    getFactories: vi.fn().mockReturnValue({ mock: 'data' }),
    getLastEdit: vi.fn().mockReturnValue(new Date(Date.now() - 1000 * 60)), // 1 minute ago
  })),
}))

const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

describe('useSyncStore', () => {
  let syncStore: ReturnType<typeof useSyncStore>

  beforeEach(() => {
    vi.clearAllMocks()
    const syncActions = {
      loadServerData: vi.fn().mockResolvedValue(true),
      syncData: vi.fn().mockResolvedValue(true),
      getServerData: vi.fn().mockResolvedValue({ data: 'mock-data' }),
      checkForOOS: vi.fn().mockReturnValue(false),
    }
    syncStore = useSyncStore(syncActions)

    // Mock global clearInterval
    global.clearInterval = vi.fn()
  })

  it('should initialize with default values', () => {
    expect(syncStore.dataSavePending.value).toBe(false)
    expect(syncStore.dataLastSaved.value).toBeNull()
    expect(syncStore.stopSyncing.value).toBe(false)
    expect(eventBus.on).toHaveBeenCalledWith('factoryUpdated', expect.any(Function))
  })

  describe('setupTick', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should set up a ticking interval', () => {
      syncStore.setupTick()
      syncStore.detectedChange()
      // expect(clearInterval).toHaveBeenCalled() // TODO: Can't get this to mock properly
      vi.advanceTimersByTime(10000) // Move forward 10 seconds
      expect(syncStore.syncActions.syncData).toHaveBeenCalled()
    })

    // TODO: Can't get clearInterval to mock properly.
    // it('should clear the existing interval when stopped', () => {
    //   syncStore.setupTick()
    //   syncStore.stopSync()
    //   expect(clearInterval).toHaveBeenCalled()
    // })
  })

  describe('tickSync', () => {
    it('should not sync if syncing is disabled', async () => {
      syncStore.stopSyncing.value = true
      expect(await syncStore.tickSync()).toBe(undefined)
      expect(syncStore.syncActions.syncData).not.toHaveBeenCalled()
    })

    it('should not sync if no data is pending', async () => {
      syncStore.stopSyncing.value = false
      syncStore.dataSavePending.value = false
      expect(await syncStore.tickSync()).toBe(undefined)
      expect(syncStore.syncActions.syncData).not.toHaveBeenCalled()
    })

    it('should sync data and update lastSaved time when data is pending', async () => {
      syncStore.stopSyncing.value = false
      syncStore.dataSavePending.value = true

      const now = new Date()
      vi.setSystemTime(now)

      await syncStore.tickSync()

      expect(syncStore.syncActions.syncData).toHaveBeenCalledWith(false, true)
      expect(syncStore.dataSavePending.value).toBe(false)
      expect(syncStore.dataLastSaved.value).toEqual(now)
    })

    it('should handle sync errors and disable syncing', async () => {
      syncStore.stopSyncing.value = false
      syncStore.dataSavePending.value = true

      syncStore.syncActions.syncData = vi.fn().mockRejectedValue(new Error('Test error'))(new Error('Test error'))

      await syncStore.tickSync()

      expect(syncStore.stopSyncing.value).toBe(true)
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('An error occurred while saving your data.')
      )
    })
  })

  describe('handleDataLoad', () => {
    it('should call loadServerData from SyncActions', async () => {
      const result = await syncStore.handleDataLoad()
      expect(syncStore.syncActions.loadServerData).toHaveBeenCalledWith(false)
      expect(result).toBe(true)
    })

    it('should pass forceLoad to loadServerData', async () => {
      const result = await syncStore.handleDataLoad(true)
      expect(syncStore.syncActions.loadServerData).toHaveBeenCalledWith(true)
      expect(result).toBe(true)
    })
  })

  describe('handleSync', () => {
    it('should pass stopSyncing and dataSavePending to syncData', async () => {
      const result = await syncStore.handleSync()
      expect(syncStore.syncActions.syncData).toHaveBeenCalledWith(false, false)
      expect(result).toBe(true)
    })
  })

  describe('detectedChange', () => {
    it('should set dataSavePending to true', () => {
      syncStore.detectedChange()
      expect(syncStore.dataSavePending.value).toBe(true)
    })
  })

  describe('stopSync', () => {
    it('should clear the sync interval and stop syncing', () => {
      syncStore.stopSync()
      expect(clearInterval).toHaveBeenCalled()
      expect(syncStore.stopSyncing.value).toBe(true)
    })
  })
})
