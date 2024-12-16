import { beforeAll, describe, expect, it } from 'vitest'
import { Factory, FactoryDependencyMetrics } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, findFacByName } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { create268Scenraio } from '@/utils/factory-setups/268-power-gen-only-import'

let factories: Factory[]
let fuelFac: Factory
let fuelGensFac: Factory

describe('268 Scenario Plan', () => {
  beforeAll(() => {
    const templateInstance = create268Scenraio()
    factories = templateInstance.getFactories()
    fuelFac = findFacByName('Fuel Factory', factories)
    fuelGensFac = findFacByName('Fuel Gens', factories)
    calculateFactories(factories, gameData, true) // Needed to calculate part metrics, dependencies will not work otherwise.
    calculateFactories(factories, gameData)
  })

  describe('Fuel Fac', () => {
    it('should have a product', () => {
      expect(fuelFac.products.length).toBe(1)
      expect(fuelFac.products[0].id).toBe('LiquidFuel')
      expect(fuelFac.products[0].amount).toBe(100)
      expect(fuelFac.products[0].recipe).toBe('LiquidFuel')
    })
    it('should have a single dependency', () => {
      const fuelGensFac = findFacByName('Fuel Gens', factories)
      expect(fuelFac.dependencies.requests).toEqual({
        [`${fuelGensFac.id}`]: [{
          requestingFactoryId: fuelGensFac.id,
          part: 'LiquidFuel',
          amount: 100,
        }],
      })
    })
    it('should have the correct dependency metrics', () => {
      const metrics: FactoryDependencyMetrics = {
        part: 'LiquidFuel',
        request: 100,
        supply: 100,
        difference: 0,
        isRequestSatisfied: true,
      }
      expect(fuelFac.dependencies.metrics).toEqual({ LiquidFuel: metrics })
    })
  })
})
