import { beforeEach, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { create220Scenario } from '@/utils/factory-setups/220-byproduct-only-part'
import { addProductToFactory } from '@/utils/factory-management/products'
import { showSatisfactionItemButton } from '@/utils/factory-management/satisfaction'
import { calculateFactories, newFactory } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { addInputToFactory } from '@/utils/factory-management/inputs'

describe('satisfaction', () => {
  let factories: Factory[]
  let mockFactory: Factory
  beforeEach(() => {
    factories = create220Scenario().getFactories()
    mockFactory = factories[0]
    calculateFactories(factories, gameData)
  })

  describe('showSatisfactionItemButton', () => {
    describe('addProduct', () => {
      it('should should NOT show if there is already a product', () => {
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlateReinforced', 'addProduct')).toBe(false)
      })
      it('should show for a part that is not a byproduct, and is not satisfied', () => {
        // SteelPlate is an ingredient of EncasedIndustrialBeam
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlate', 'addProduct')).toBe(true)
      })
      it('should NOT show for a part that is raw', () => {
        // Add a product that requires a raw ingredient
        addProductToFactory(mockFactory, {
          id: 'IronIngot',
          amount: 10,
          recipe: 'IngotIron',
        })
        calculateFactories(factories, gameData)

        expect(showSatisfactionItemButton(mockFactory, 'OreIron', 'addProduct')).toBe(false)
      })
      it('should NOT show for a part that is satisfied', () => {
        // Add import to satisfy the part
        const steelFac = newFactory('Steel')
        addProductToFactory(steelFac, {
          id: 'SteelPlate',
          amount: 1000,
          recipe: 'SteelPlate',
        })
        factories.push(steelFac)
        addInputToFactory(mockFactory, {
          factoryId: steelFac.id,
          outputPart: 'SteelPlate',
          amount: 1000,
        })
        calculateFactories(factories, gameData)

        // SteelPlateReinforced is now satisfied
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlate', 'addProduct')).toBe(false)
      })
      it('should NOT show for a part that is already a byproduct within the factory', () => {
        expect(showSatisfactionItemButton(mockFactory, 'HeavyOilResidue', 'addProduct')).toBe(false)
      })
    })
    describe('showFixProduct', () => {
      beforeEach(() => {
        // Add SteelPlates to the factory, at a deficit
        addProductToFactory(mockFactory, {
          id: 'SteelPlate',
          amount: 1,
          recipe: 'SteelPlate',
        })
      })
      it('should show if a part is a product and is not producing enough', () => {
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlate', 'fixProduct')).toBe(true)
      })
    })
    describe('correctManually', () => {
      it('should show for a part that is already a byproduct within the factory', () => {
        expect(showSatisfactionItemButton(mockFactory, 'HeavyOilResidue', 'correctManually')).toBe(true)
      })
      it('should NOT show for a product already in the factory', () => {
        addProductToFactory(mockFactory, {
          id: 'SteelPlate',
          amount: 1,
          recipe: 'SteelPlate',
        })
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlate', 'correctManually')).toBe(false)
      })
      it('should NOT show for a part that can be added as a product directly', () => {
        expect(showSatisfactionItemButton(mockFactory, 'SteelPlate', 'correctManually')).toBe(false)
      })
    })
  })
})
