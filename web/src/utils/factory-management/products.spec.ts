import { beforeEach, describe, expect, it } from 'vitest'
import { Factory, FactoryItem } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, newFactory } from '@/utils/factory-management/factory'
import {
  addProductToFactory,
  fixProduct, shouldShowFix,
  shouldShowInternal,
  shouldShowNotInDemand,
} from '@/utils/factory-management/products'
import { gameData } from '@/utils/gameData'
import { addInputToFactory } from '@/utils/factory-management/inputs'
import { calculatePartMetrics } from '@/utils/factory-management/parts'
import { create321Scenario } from '@/utils/factory-setups/321-product-byproduct-trimming'

const mockIngotIron = {
  id: 'IronIngot',
  amount: 123,
  recipe: 'IngotIron',
}
const mockIngotCopper = {
  id: 'CopperIngot',
  amount: 123,
  recipe: 'IngotCopper',
}

describe('products', () => {
  let mockFactory: Factory

  beforeEach(() => {
    mockFactory = newFactory('Iron Ingots')
    addProductToFactory(mockFactory, mockIngotIron)
    calculateFactories([mockFactory], gameData)
  })

  describe('addProductToFactory', () => {
    it('should add a product to a factory', () => {
      expect(mockFactory.products.length).toBe(1)
      expect(mockFactory.products[0].id).toBe('IronIngot')
    })
    it('should add a product of different recipe to the factory', () => {
      const mockProductAlt = {
        id: 'IronIngot',
        amount: 123,
        recipe: 'Alternate_IngotIron',
      }
      addProductToFactory(mockFactory, mockProductAlt)

      expect(mockFactory.products.length).toBe(2)
      expect(mockFactory.products[1].id).toBe('IronIngot')
    })
    it('should add a part to the factory', () => {
      expect(mockFactory.parts.IronIngot).toBeDefined()
    })
    it('should add proper display orders', () => {
      addProductToFactory(mockFactory, mockIngotIron)
      addProductToFactory(mockFactory, mockIngotCopper)

      expect(mockFactory.products[0].displayOrder).toBe(0)
      expect(mockFactory.products[1].displayOrder).toBe(1)
    })
  })

  describe('calculateProducts', () => {
    beforeEach(() => {
      mockFactory.products = []
      mockFactory.parts = {}
    })
    it('should calculate the products and produce the correct part info', () => {
      addProductToFactory(mockFactory, mockIngotIron)
      addProductToFactory(mockFactory, mockIngotCopper)
      calculateFactories([mockFactory], gameData)

      // Expect the parts to exist
      expect(mockFactory.parts.IronIngot).toBeDefined()
      expect(mockFactory.parts.CopperIngot).toBeDefined()

      // Expect the parts to have the correct amount of surplus data
      expect(mockFactory.parts.IronIngot.amountSuppliedViaProduction).toBe(123)
      expect(mockFactory.parts.IronIngot.amountSupplied).toBe(123)
      expect(mockFactory.parts.IronIngot.amountRemaining).toBe(123)
      expect(mockFactory.parts.IronIngot.satisfied).toBe(true)
      expect(mockFactory.power.consumed).toBe(32.382) // 4.1x iron ingot smelters + 4.1x copper ingot smelters

      // Expect the raw resources to exist
      expect(mockFactory.rawResources.OreIron).toBeDefined()
      expect(mockFactory.rawResources.OreCopper).toBeDefined()
      expect(mockFactory.parts.OreIron).toBeDefined()
      expect(mockFactory.parts.OreCopper).toBeDefined()
      // Expect the raw resources to have the correct amounts
      expect(Number(mockFactory.rawResources.OreIron.amount.toFixed(3))).toBe(123)
      expect(Number(mockFactory.rawResources.OreCopper.amount.toFixed(3))).toBe(123)

      // Expect the rawResource data to be correct
      expect(mockFactory.rawResources.OreIron.name).toBe('Iron Ore')
      expect(mockFactory.parts.OreIron.isRaw).toBe(true)

      // Expect the product to have the correct amount of requirement data
      expect(Number(mockFactory.products[0].requirements.OreIron.amount.toFixed(3))).toBe(123)
    })

    it('should properly calculate part requirements when the recipe returns more than 1 part itself', () => {
      const mockProduct = {
        id: 'CircuitBoard',
        amount: 98,
        recipe: 'Alternate_CircuitBoard_2',
      }

      addProductToFactory(mockFactory, mockProduct)
      calculateFactories([mockFactory], gameData)

      expect(mockFactory.parts.CircuitBoard.amountSupplied).toBe(98)
      expect(mockFactory.parts.HighSpeedWire.amountRequired).toBe(420) // Nice
      expect(mockFactory.parts.Plastic.amountRequired).toBe(140)
    })
    it('should properly calculate part requirements when the recipe returns more than 1 part itself along with rounding', () => {
      const mockProduct = {
        id: 'CircuitBoard',
        amount: 100,
        recipe: 'Alternate_CircuitBoard_2',
      }

      addProductToFactory(mockFactory, mockProduct)
      calculateFactories([mockFactory], gameData)

      expect(mockFactory.parts.CircuitBoard.amountSupplied).toBe(100)
      expect(Number(mockFactory.parts.HighSpeedWire.amountRequired.toFixed(3))).toBe(428.571)
      expect(Number(mockFactory.parts.Plastic.amountRequired.toFixed(3))).toBe(142.857)
    })
    it('should properly calculate metrics when two products require the same ingredient', () => {
      const mockProductIronPlate = {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      }
      const mockProductIronRod = {
        id: 'IronRod',
        amount: 100,
        recipe: 'IronRod',
      }
      mockIngotIron.amount = 100

      // Reset the mock factory, we want very specific detail here
      mockFactory.products = []
      mockFactory.parts = {}

      // Add the product that's being used
      addProductToFactory(mockFactory, mockIngotIron)

      // Add the products being made
      addProductToFactory(mockFactory, mockProductIronPlate)
      addProductToFactory(mockFactory, mockProductIronRod)

      calculateFactories([mockFactory], gameData)

      // Expect the ingredient requirements to be correct
      // Iron Plate ratio is 3:2 so 150 iron ingots are required
      // Iron Rod ratio is 1:1 so 100 iron ingots are required
      // Totalling 250 Iron Ingots
      expect(mockFactory.parts.IronIngot.amountRequired).toBe(250)

      // Expect the calculation to be correct
      // Producing 100 iron ingots
      expect(mockFactory.parts.IronIngot.amountSupplied).toBe(100)
      // Therefore we expect a deficit of 150 iron ingots
      expect(mockFactory.parts.IronIngot.amountRemaining).toBe(-150)
      // Thus should not be satisfied
      expect(mockFactory.parts.IronIngot.satisfied).toBe(false)
    })

    it('should properly calculate metrics when two same products are using different recipes', () => {
      const mockProduct1 = {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      }
      const mockProduct2 = {
        id: 'IronPlate',
        amount: 100,
        recipe: 'Alternate_CoatedIronPlate',
      }

      // Add the products that's being used
      addProductToFactory(mockFactory, mockProduct1)
      addProductToFactory(mockFactory, mockProduct2)

      calculateFactories([mockFactory], gameData)

      // This should result in 200 iron plates being made.
      expect(mockFactory.parts.IronPlate.amountSupplied).toBe(200)
      expect(mockFactory.parts.IronPlate.amountSuppliedViaProduction).toBe(200)
      expect(mockFactory.parts.IronPlate.amountRemaining).toBe(200) // Should be 200 left as there's no demand
      expect(mockFactory.parts.IronPlate.amountSuppliedViaInput).toBe(0)
    })
    it('should properly calculate metrics when products are duplicated using same recipe', () => {
      const mockProduct1 = {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      }
      const mockProduct2 = {
        id: 'IronPlate',
        amount: 200,
        recipe: 'IronPlate',
      }
      // Add the products that's being used
      addProductToFactory(mockFactory, mockProduct1)
      addProductToFactory(mockFactory, mockProduct2)

      calculateFactories([mockFactory], gameData)

      // This should result in 300 iron plates being made.
      expect(mockFactory.parts.IronPlate.amountSupplied).toBe(300)
      expect(mockFactory.parts.IronPlate.amountSuppliedViaProduction).toBe(300)
      expect(mockFactory.parts.IronPlate.amountRemaining).toBe(300) // No demands, 300 left
      expect(mockFactory.parts.IronPlate.amountSuppliedViaInput).toBe(0)
    })
    it('should properly calculate metrics when products are duplicated 3 times using different recipes', () => {
      const mockProduct1 = {
        id: 'IronPlate',
        amount: 50,
        recipe: 'IronPlate',
      }
      const mockProduct2 = {
        id: 'IronPlate',
        amount: 50,
        recipe: 'Alternate_CoatedIronPlate',
      }
      const mockProduct3 = {
        id: 'IronPlate',
        amount: 50,
        recipe: 'Alternate_CoatedIronPlate',
      }
      // Add the products that's being used
      addProductToFactory(mockFactory, mockProduct1)
      addProductToFactory(mockFactory, mockProduct2)
      addProductToFactory(mockFactory, mockProduct3)

      calculateFactories([mockFactory], gameData)

      // This should result in 150 iron plates being made.
      expect(mockFactory.parts.IronPlate.amountSupplied).toBe(150)
      expect(mockFactory.parts.IronPlate.amountSuppliedViaProduction).toBe(150)
      expect(mockFactory.parts.IronPlate.amountRemaining).toBe(150) // No demands, 150 left
      expect(mockFactory.parts.IronPlate.amountSuppliedViaInput).toBe(0)
    })
  })

  describe('calculateByProducts', () => {
    beforeEach(() => {
      mockFactory.name = 'Fuel'
    })
    it('should do nothing if the recipe contains no byproducts', () => {
      const mockProductWithoutByProducts = {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      }

      addProductToFactory(mockFactory, mockProductWithoutByProducts)
      calculateFactories([mockFactory], gameData)

      expect(mockFactory.products[0].byProducts).toHaveLength(0)
    })
    it('should calculate byproducts', () => {
      mockFactory.products = []
      const mockProductWithByProducts = {
        id: 'LiquidFuel',
        amount: 100,
        recipe: 'LiquidFuel',
      }

      addProductToFactory(mockFactory, mockProductWithByProducts)
      calculateFactories([mockFactory], gameData)

      expect(mockFactory.products[0].id).toBe('LiquidFuel')
      expect(mockFactory.products[0].byProducts).toHaveLength(1)
      // @ts-ignore
      expect(mockFactory.products[0].byProducts[0].id).toBe('PolymerResin')

      // Expect that the ByProduct exists in the factory.byProducts array
      expect(mockFactory.byProducts[0].id).toBe('PolymerResin')

      // Expect that the byproduct has been added to the parts array for potential consumption by other products.
      expect(mockFactory.parts.PolymerResin.amountSupplied).toBe(75)
    })
  })

  describe('shouldShowInternal', () => {
    it('should return false if part could not be found', () => {
      mockFactory.parts = {}
      expect(shouldShowInternal(mockFactory.products[0], mockFactory)).toBe(false)
    })
    it('should show when the product is used internally', () => {
      addProductToFactory(mockFactory, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      })
      addProductToFactory(mockFactory, {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      })
      calculateFactories([mockFactory], gameData)

      expect(shouldShowInternal(mockFactory.products[0], mockFactory)).toBe(true)
    })

    it('should not show when product is not used internally', () => {
      addProductToFactory(mockFactory, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      })
      calculateFactories([mockFactory], gameData)

      expect(shouldShowInternal(mockFactory.products[0], mockFactory)).toBe(false)
    })
  })

  describe('shouldShowFix', () => {
    it('should return null if there\'s no product', () => {
      expect(shouldShowFix({} as FactoryItem, mockFactory)).toBe(null)
    })
    it('should return null if there\'s no part', () => {
      mockFactory.parts = {}
      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe(null)
    })
    it('should return null if there\'s no product amount', () => {
      mockFactory.products[0].amount = 0
      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe(null)

      mockFactory.products[0].amount = 1
      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe(null)
    })
    it('should return deficit if there\'s an deficit', () => {
      calculatePartMetrics(mockFactory, gameData)
      // Create a deficit
      mockFactory.parts.IronIngot.amountRemaining = -50

      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe('deficit')
    })
    it('should return null if there\'s a surplus but no demand for the product via export', () => {
      calculatePartMetrics(mockFactory, gameData)
      // Create a surplus
      mockFactory.parts.IronIngot.amountRemaining = 50
      mockFactory.parts.IronIngot.amountRequired = 0

      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe(null)
    })
    it('should return surplus if there\'s an surplus', () => {
      calculatePartMetrics(mockFactory, gameData)
      // Create a surplus
      mockFactory.parts.IronIngot.amountRequired = 50

      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe('surplus')
    })
    it('should show nothing if it is fully satisfied even with export demands', () => {
      // Add a demand
      const mockFactory2 = newFactory('Iron Plates')

      addInputToFactory(mockFactory2, {
        factoryId: mockFactory.id,
        amount: 100,
        outputPart: 'IronIngot',
      })

      // Set the product to match the demand, thus creating an equilibrium
      mockFactory.products[0].amount = 100

      calculateFactories([mockFactory, mockFactory2], gameData)

      expect(mockFactory.parts.IronIngot.amountRequired).toBe(100)

      expect(shouldShowFix(mockFactory.products[0], mockFactory)).toBe(null)
    })
  })

  describe('shouldShowNotInDemand', () => {
    it('should not show if the product ID is missing', () => {
      expect(shouldShowNotInDemand({} as FactoryItem, mockFactory)).toBe(false)
    })
    it('should show when the product is not in demand', () => {
      addProductToFactory(mockFactory, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      })

      calculateFactories([mockFactory], gameData)
      expect(mockFactory.parts.IronIngot.amountRequired).toBe(0)

      expect(shouldShowNotInDemand(mockFactory.products[0], mockFactory)).toBe(true)
    })

    it('should not show when product has internal demand but not export demand', () => {
      addProductToFactory(mockFactory, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      })
      addProductToFactory(mockFactory, {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      })

      calculateFactories([mockFactory], gameData)
      expect(mockFactory.parts.IronIngot.amountRequired).toBe(150)
      expect(mockFactory.parts.IronIngot.amountRequiredExports).toBe(0)
      expect(mockFactory.parts.IronIngot.amountRequiredProduction).toBe(150)

      expect(shouldShowNotInDemand(mockFactory.products[0], mockFactory)).toBe(false)
    })
    it('should not show not in demand chip when product has export demand', () => {
      const mockFactory2 = newFactory('Iron Plates')
      addProductToFactory(mockFactory, {
        id: 'IronIngot',
        amount: 100,
        recipe: 'IngotIron',
      })
      addInputToFactory(mockFactory2, {
        factoryId: mockFactory.id,
        amount: 100,
        outputPart: 'IronIngot',
      })
      calculateFactories([mockFactory, mockFactory2], gameData)

      expect(shouldShowNotInDemand(mockFactory.products[0], mockFactory)).toBe(false)
    })
  })

  describe('fixProduct', () => {
    it('should throw an error if the product ID is missing', () => {
      const mockProduct = {
        id: '',
        amount: 100,
        recipe: 'IngotIron',
      } as FactoryItem
      expect(() => {
        fixProduct(mockProduct, mockFactory)
      }).toThrow('products: fixPart: Product ID is missing!')
    })
    it('should throw if the part is missing', () => {
      const mockProduct = {
        id: 'IronPlate',
        amount: 100,
        recipe: 'IronPlate',
      } as FactoryItem

      // Will fail as the parts haven't been calculated
      expect(() => {
        fixProduct(mockProduct, mockFactory)
      }).toThrow(`products: fixPart: Part data for "${mockProduct.id}" is missing!`)
    })
    it('should correct the product amount if it is incorrect', () => {
      const mockProduct = {
        id: 'CopperIngot',
        amount: 1000,
        recipe: 'IngotCopper',
      }

      addProductToFactory(mockFactory, mockProduct)
      calculateFactories([mockFactory], gameData)

      // Make the part amount now incorrect
      mockFactory.parts.CopperIngot.amountRequired = 123

      // It should be out of sync
      expect(mockFactory.parts.CopperIngot.amountRequired).toBe(123)
      expect(mockFactory.products[1].amount).toBe(1000)

      // Fix the product
      fixProduct(mockFactory.products[1], mockFactory) // This is important to be directly the product as it is in the factory, as it's passed via reference at the UI level

      // It should now be in sync with parts
      expect(mockFactory.parts.CopperIngot.amountRequired).toBe(123)
      expect(mockFactory.products[1].amount).toBe(123)
    })

    describe('fixProduct byproduct handling', () => {
      let factories: Factory[]
      let mockFactory: Factory
      beforeEach(() => {
        factories = create321Scenario().getFactories()
        mockFactory = factories[0]
        calculateFactories(factories, gameData)
      })
      it('should balance HOR correctly when told to trim', () => {
        fixProduct(mockFactory.products[1], mockFactory)

        expect(mockFactory.products[1].amount).toBe(40) // HOR should trim to this, 40 is made by polymer resin, 20 made by plastic
      })

      it('should balance HOR correctly when told to satisfy', () => {
        mockFactory.products[1].amount = 5
        calculateFactories([mockFactory], gameData)

        fixProduct(mockFactory.products[1], mockFactory)

        expect(mockFactory.products[1].amount).toBe(40) // HOR should be satisfied to 40
      })
    })
  })
})
