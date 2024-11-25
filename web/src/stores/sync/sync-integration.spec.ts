// This file does an integration test that checks the full auth and sync flow.
// The intention is to test when the user logs in that their data is synced across.
// We also need to test for when the data is out of sync what happens.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSyncStore } from '@/stores/sync-store'
import { useAuthStore } from '@/stores/auth-store'
import { useAppStore } from '@/stores/app-store'
import { newFactory } from '@/utils/factory-management/factory'

describe('Sync Integration', () => {
  it('should sync data when user logs in', async () => {
    const syncStore = useSyncStore()
    const authStore = useAuthStore()
    const appStore = useAppStore()

    // Set up the app store with some data
    appStore.setFactories([newFactory('My Test Factory')])

    // Mock the auth store to return a user
    authStore.getLoggedInUser = vi.fn().mockReturnValue('testuser')

    // Mock the sync actions to return a successful sync
    syncStore.syncActions.syncData = vi.fn().mockResolvedValue(true)

    // Set up the sync store
    syncStore.setupTick()

    // Wait for the sync to happen
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that the data was synced
    expect(syncStore.dataSavePending.value).toBe(false)
    expect(syncStore.dataLastSaved.value).not.toBeNull()
  })
})
