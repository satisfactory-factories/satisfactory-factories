import { beforeEach, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { calculateSyncState } from '@/utils/factory-management/syncState'

describe('syncState', () => {
  let mockFactory: Factory

  beforeEach(() => {
    mockFactory = newFactory('Iron Ingots')
    addProductToFactory(mockFactory, {
      id: 'IronIngot',
      amount: 100,
      recipe: 'IngotIron',
    })

    mockFactory.syncState = {
      IronIngot: {
        amount: 100,
        recipe: 'IngotIron',
      },
    }

    mockFactory.inSync = true
  })

  describe('calculateSyncState', () => {
    it('should not make changes to a synced factory', () => {
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(true)
    })

    it('should detect a de-synced factory', () => {
      mockFactory.syncState.IronIngot.amount = 50

      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })

    it('should not affect a factory with no sync state', () => {
      mockFactory.inSync = null
      mockFactory.syncState = {}

      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(null)
    })

    it('should detect a desynced factory across multiple products', () => {
      addProductToFactory(mockFactory, {
        id: 'CopperIngot',
        amount: 100,
        recipe: 'CopperIngot',
      })
      mockFactory.syncState.IronIngot = { amount: 100, recipe: 'IronIngot' }
      mockFactory.syncState.CopperIngot = { amount: 50, recipe: 'CopperIngot' }

      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })

    it('should maintain a synced factory across multiple products', () => {
      addProductToFactory(mockFactory, {
        id: 'CopperIngot',
        amount: 100,
        recipe: 'CopperIngot',
      })
      mockFactory.inSync = true
      mockFactory.syncState.IronIngot.amount = 100
      mockFactory.syncState.CopperIngot = { amount: 100, recipe: 'CopperIngot' }

      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(true)
    })

    it('should drop factory out of sync when there are no products', () => {
      mockFactory.products = []
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })

    it('should mark a factory as out of sync when there are no products', () => {
      mockFactory.products = []
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })

    it('should mark a factory as out of sync when new products are added', () => {
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(true)

      addProductToFactory(mockFactory, {
        id: 'CopperIngot',
        amount: 100,
        recipe: 'CopperIngot',
      })
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })

    it('should mark a factory as out of sync when the recipe of a product is changed', () => {
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(true)

      mockFactory.products[0].recipe = 'Alternate_IronIngot_Basic'
      calculateSyncState(mockFactory)
      expect(mockFactory.inSync).toBe(false)
    })
  })
})
