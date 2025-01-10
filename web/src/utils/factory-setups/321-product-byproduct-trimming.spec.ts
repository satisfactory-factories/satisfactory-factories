import { beforeAll, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, findFacByName } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { create321Scenario } from '@/utils/factory-setups/321-product-byproduct-trimming'

let factories: Factory[]
let mockFactory: Factory

describe('321 Scenario Plan', () => {
  beforeAll(() => {
    const templateInstance = create321Scenario()
    factories = templateInstance.getFactories()
    mockFactory = findFacByName('Byproduct balancing', factories)
    calculateFactories(factories, gameData)
  })

  describe('Balancing user operations', () => {
    it('should properly set up resin to be balanced', () => {
      // Need to set up heavy oil residue to be 40
      const heavyOilResidueProduct = mockFactory.products.find(p => p.id === 'HeavyOilResidue')
      if (!heavyOilResidueProduct) {
        throw new Error('HeavyOilResidue product not found')
      }
      heavyOilResidueProduct.amount = 40

      // Need to set Rubber to be 140
      const rubberProduct = mockFactory.products.find(p => p.id === 'Rubber')
      if (!rubberProduct) {
        throw new Error('Rubber product not found')
      }
      rubberProduct.amount = 140

      // Need to set up polymer resin to be 260
      const polymerResinProduct = mockFactory.products.find(p => p.id === 'PolymerResin')
      if (!polymerResinProduct) {
        throw new Error('HeavyOilResidue product not found')
      }
      polymerResinProduct.amount = 260

      // Run calculations
      calculateFactories(factories, gameData)

      // Check the results, all should be balanced
      expect(mockFactory.parts.PolymerResin.amountRemaining).toBe(0)
      expect(mockFactory.parts.HeavyOilResidue.amountRemaining).toBe(0)
    })
  })
})
