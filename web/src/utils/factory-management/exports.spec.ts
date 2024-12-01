import { beforeEach, describe, expect, it } from 'vitest'
import { calculateFactories, findFacByName, newFactory } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { addInputToFactory } from '@/utils/factory-management/inputs'
import { addProductToFactory } from '@/utils/factory-management/products'
import { internalProductionDeficitPlan } from '@/utils/factory-setups/internal-production-deficit-plan'

let ironIngotFac = newFactory('Iron Ingots')
let ironPlateFac = newFactory('Iron Plates')
let oilFac = newFactory('Oil Factory')

describe('exports', () => {
  describe('calculateExports', () => {
    beforeEach(() => {
    // Reset the mocks
      ironIngotFac = newFactory('Iron Ingots')
      ironPlateFac = newFactory('Iron Plates')
      oilFac = newFactory('Oil Factory')

      addProductToFactory(ironIngotFac, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron', // I love this game's recipe naming being inconsistent
      })

      addProductToFactory(ironPlateFac, {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      })

      addProductToFactory(oilFac, {
        id: 'LiquidOil',
        amount: 30,
      })

      addProductToFactory(oilFac, {
        id: 'HeavyOilResidue',
        amount: 40,
        recipe: 'Alternate_HeavyOilResidue',
      })
    })
    it('should calculate exports correctly when no factories requesting it', () => {
      const factories = [ironIngotFac]

      calculateFactories(factories, gameData)

      expect(ironIngotFac.exports.IronIngot.surplus).toEqual(100)
      expect(ironIngotFac.exports.IronIngot.demands).toEqual(0)
    })

    // Iron ingot production: 100
    // Iron ingot demands from plate: 150
    // 50 ingot deficit
    // Should be a shortage of 50 ingots
    it('should calculate export demands and shortages correctly', () => {
      const factories = [ironIngotFac, ironPlateFac]

      addInputToFactory(ironPlateFac, {
        factoryId: ironIngotFac.id,
        outputPart: 'IronIngot',
        amount: 150, // To produce 100 plates
      })

      // This should have added the dependency for us, thus calculateExports should have added the export because it's a dependant.
      calculateFactories(factories, gameData)
      expect(ironIngotFac.exports.IronIngot).toEqual({
        productId: 'IronIngot',
        surplus: -50, // All used up in production + export demand
        demands: 150,
        supply: 100, // 100 produced
        displayOrder: 0,
      })
    })
    it('should calculate exports correctly with multiple factories', () => {
      const ironRodsFac = newFactory('Iron Rods')
      const factories = [ironIngotFac, ironPlateFac, ironRodsFac]

      addInputToFactory(ironPlateFac, {
        factoryId: ironIngotFac.id,
        outputPart: 'IronIngot',
        amount: 50,
      })
      addInputToFactory(ironRodsFac, {
        factoryId: ironIngotFac.id,
        outputPart: 'IronIngot',
        amount: 75,
      })

      calculateFactories(factories, gameData)

      expect(ironIngotFac.exports.IronIngot.demands).toEqual(125)
    })
    it('should calculate exports correctly when factory is in a production deficit, without export demands', () => {
      const factories = [ironIngotFac]

      // Producing 100 iron ingots
      // Plates will create a 200 ingot deficit as it needs 300 total
      addProductToFactory(ironIngotFac, {
        id: 'IronPlate',
        amount: 200,
        recipe: 'IronPlate',
      })

      calculateFactories(factories, gameData)

      expect(ironIngotFac.exports.IronIngot).toStrictEqual({
        productId: 'IronIngot',
        surplus: -200, // 200 ingot deficit
        demands: 0,
        supply: 100,
        displayOrder: 0,
      })
    })

    // Issue Ref: #107
    it('should calculate exports correctly when factory is in a production deficit, with demands', () => {
      const factories = [ironIngotFac, ironPlateFac]

      // 100 iron ingots are already being produced
      // Will produce a 50 ingot internal deficit, as we are producing 100 ingots and 150 are needed to make plates
      addProductToFactory(ironIngotFac, {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      })

      // Not used in calculations but for completeness sake
      addProductToFactory(ironPlateFac, {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      })
      // Demand from the ingot factory
      addInputToFactory(ironPlateFac, {
        factoryId: ironIngotFac.id,
        outputPart: 'IronIngot',
        amount: 150, // to fulfil the 100 iron plate demand in ironPlateFac
      })

      calculateFactories(factories, gameData)

      // Iron ingot production: 100
      // Iron ingot internally demands from plate: 150
      // Iron ingot external demands from plate: 150
      // Total demands should be 300
      expect(ironIngotFac.exports.IronIngot.demands).toBe(150)

      // Deficit should be 200
      expect(ironIngotFac.exports.IronIngot.surplus).toBe(-200)

      // Production should be 100
      expect(ironIngotFac.exports.IronIngot.supply).toBe(100)
    })
    it('should calculate exports correctly with confirmed bugged factory', () => {
      const factories = internalProductionDeficitPlan()

      calculateFactories(factories, gameData)

      const wireFac = findFacByName('Wire', factories)
      expect(wireFac.parts.Wire.amountRemaining).toBe(-290)
      expect(wireFac.exports.Wire.surplus).toBe(-290)
      expect(wireFac.exports.Wire.demands).toBe(170)
    })
    it('should calculate exports correctly with products that have byproduct(s)', () => {
      const factories = [oilFac]

      calculateFactories(factories, gameData)

      expect(oilFac.byProducts.length).toBe(1)
      expect(oilFac.byProducts[0].id).toBe('PolymerResin')
      expect(oilFac.byProducts[0].amount).toBe(20)

      expect(oilFac.exports.PolymerResin).toBeDefined()
      expect(oilFac.exports.PolymerResin.surplus).toBe(20)
    })
  })
})
