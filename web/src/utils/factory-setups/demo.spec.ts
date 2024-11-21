import { beforeEach, describe, expect, it } from '@jest/globals'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, findFacByName } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { getRequestsForFactoryByProduct } from '@/utils/factory-management/exports'
import { createDemo } from '@/utils/factory-setups/demo'

let factories: Factory[]
let oilFac: Factory
let circuitBoardsFac: Factory
let computersFac: Factory

// This test file in effect tests most of the functionality we expect from the data.
describe('Complex Plan test', () => {
  beforeEach(() => {
    factories = createDemo().getFactories()
    oilFac = findFacByName('Oil Processing', factories)
    circuitBoardsFac = findFacByName('Circuit Boards', factories)
    computersFac = findFacByName('Computers (end product)', factories)
    calculateFactories(factories, gameData)
  })

  it('should have factories', () => {
    expect(factories.length).toBeGreaterThan(0)
  })
  it('should have the expected number of factories', () => {
    expect(factories.length).toBe(5)
  })
  describe('Oil Processing', () => {
    it('should have Oil Processing factory configured correctly', () => {
      expect(oilFac.products.length).toBe(2)
      expect(oilFac.products[0].id).toBe('Plastic')
      expect(oilFac.products[0].amount).toBe(640)
      expect(oilFac.products[1].id).toBe('LiquidFuel')
      expect(oilFac.products[1].amount).toBe(40)
    })
    it('should have product requirements calculated correctly', () => {
      expect(oilFac.products[0].requirements).toStrictEqual({ LiquidOil: { amount: 960 } })
    })
    it('should have byproducts calculated correctly', () => {
      expect(oilFac.products[0].byProducts).toStrictEqual([{
        id: 'HeavyOilResidue',
        byProductOf: 'Plastic',
        amount: 320,
      }])
    })
    it('should have fluid parts calculated correctly', () => {
      expect(oilFac.parts.LiquidOil).toStrictEqual({
        amountRequired: 960,
        amountSupplied: 960,
        amountSuppliedViaInput: 960,
        amountSuppliedViaProduction: 0,
        amountRemaining: 0,
        satisfied: true,
        isRaw: true,
      })
      expect(oilFac.parts.LiquidFuel).toStrictEqual({
        amountRequired: 0,
        amountSupplied: 40,
        amountSuppliedViaInput: 0,
        amountSuppliedViaProduction: 40,
        amountRemaining: -40,
        satisfied: true,
        isRaw: false,
      })
      // TODO: There's a bug here! #2
      expect(oilFac.parts.HeavyOilResidue).toStrictEqual({
        amountRequired: 240,
        amountSupplied: 320,
        amountSuppliedViaInput: 0,
        amountSuppliedViaProduction: 320,
        amountRemaining: -80,
        satisfied: true,
        isRaw: false,
      })
    })
    it('should have solid parts calculated correctly', () => {
      expect(oilFac.parts.Plastic).toStrictEqual({
        amountRequired: 0,
        amountSupplied: 640,
        amountSuppliedViaInput: 0,
        amountSuppliedViaProduction: 640,
        amountRemaining: -640,
        satisfied: true,
        isRaw: false,
      })
    })
    it('should have satisfaction calculated correctly', () => {
      expect(oilFac.requirementsSatisfied).toBe(true)
      expect(oilFac.usingRawResourcesOnly).toBe(false)
      expect(oilFac.hasProblem).toBe(false)
    })
    it('should have dependencies calculated correctly', () => {
      expect(Object.keys(oilFac.dependencies.requests)).toHaveLength(2)
      expect(oilFac.dependencies.metrics.Plastic.request).toBe(640) // Comes from 2 requests
    })
    it('should have the correct dependencies and metrics', () => {
      const requests = getRequestsForFactoryByProduct(oilFac, 'Plastic')
      const expectedFactoryIds = [computersFac.id, circuitBoardsFac.id]
      let found = 0
      let productAmount = 0

      requests.forEach(request => {
        if (expectedFactoryIds.includes(request.requestingFactoryId)) {
          found++
          productAmount += request.amount
        }
      })

      if (found !== expectedFactoryIds.length) {
        throw new Error('Not all expected factories were found in the requests')
      }

      if (productAmount !== oilFac.dependencies.metrics.Plastic.request) {
        throw new Error('The total product amount found via dependencies  does not match the expected requested amount')
      }
    })

    // NOT PASSING due to #35
    it('should have the correct amount of power calculated', () => {
      // Should be 33 buildings * 30 power per building = 990
      expect(oilFac.totalPower).toBe(990)
    })

    // NOT PASSING due to #35
    it('should have the correct number of buildings calculated along with their power', () => {
      expect(oilFac.buildingRequirements).toStrictEqual({
        oilrefinery: {
          name: 'oilrefinery',
          amount: 33,
          powerPerBuilding: 30, // Known bug
          totalPower: 990,
        },
      })
    })
  })

  it('should have Copper Ingots factory configured correctly', () => {
    const copperIngotsFac = findFacByName('Copper Ingots', factories)
    expect(copperIngotsFac.products.length).toBe(1)
    expect(copperIngotsFac.products[0].id).toBe('CopperIngot')
    expect(copperIngotsFac.products[0].amount).toBe(640)
    expect(copperIngotsFac.dependencies.metrics.CopperIngot.request).toBe(320)
  })
  it('should have Copper Basics factory configured correctly', () => {
    const copperBasicsFac = findFacByName('Copper Basics', factories)
    expect(copperBasicsFac.products.length).toBe(3)
    expect(copperBasicsFac.products[0].id).toBe('Wire')
    expect(copperBasicsFac.products[0].amount).toBe(320)
    expect(copperBasicsFac.products[1].id).toBe('Cable')
    expect(copperBasicsFac.products[1].amount).toBe(160)
    expect(copperBasicsFac.products[2].id).toBe('CopperSheet')
    expect(copperBasicsFac.products[2].amount).toBe(160)
  })
  it('should have Circuit Boards factory configured correctly', () => {
    const circuitBoardsFac = findFacByName('Circuit Boards', factories)
    expect(circuitBoardsFac.products.length).toBe(1)
    expect(circuitBoardsFac.products[0].id).toBe('CircuitBoard')
    expect(circuitBoardsFac.products[0].amount).toBe(80)
  })
  it('should have Computers factory configured correctly', () => {
    const computersFac = findFacByName('Computers (end product)', factories)
    expect(computersFac.products.length).toBe(1)
    expect(computersFac.products[0].id).toBe('Computer')
    expect(computersFac.products[0].amount).toBe(20)
  })
})