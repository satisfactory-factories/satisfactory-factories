import { beforeAll, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, findFacByName } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { create251Scenario } from '@/utils/factory-setups/251-multiple-imports'
import { satisfyImport } from '@/utils/factory-management/inputs'

let factories: Factory[]
let factoryC: Factory

describe('251 Scenario Plan', () => {
  beforeAll(() => {
    const templateInstance = create251Scenario()
    factories = templateInstance.getFactories()
    factoryC = findFacByName('Factory C', factories)
    calculateFactories(factories, gameData)
  })

  describe('Balancing user operations', () => {
    it('should properly trim Factory B compacted coal input', () => {
      satisfyImport(1, factoryC) // Trim Factory B import via "user" action
      // Run calculations
      calculateFactories(factories, gameData)

      // Check the results, all should be balanced
      expect(factoryC.parts.CompactedCoal.amountRemaining).toBe(0) // Should be fully satisfied
      expect(factoryC.parts.CompactedCoal.amountSuppliedViaInput).toBe(800) // Should have taken 800 from imports
      expect(factoryC.parts.CompactedCoal.amountSuppliedViaProduction).toBe(0) // No local production
      expect(factoryC.inputs[0].amount).toBe(540) // Shouldn't have touched the other import
      expect(factoryC.inputs[1].amount).toBe(260)
    })
  })
})
