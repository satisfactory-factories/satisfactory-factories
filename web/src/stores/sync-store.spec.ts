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

})
