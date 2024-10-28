import { beforeEach, describe, expect, it } from '@jest/globals'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory, calculateByProducts, calculateProducts } from '@/utils/factory-management/products'
import { mockGameData } from '@/utils/factory-management/mocks/mockGameData'

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
  })

  describe('addProductToFactory', () => {
    it('should add a product to a factory', () => {
      expect(() => {
        addProductToFactory(mockFactory, mockIngotIron)
      }).not.toThrow()

      expect(mockFactory.products.length).toBe(1)
      expect(mockFactory.products[0].id).toBe('IngotIron')
    })
    it('should add a part to the factory', () => {
      addProductToFactory(mockFactory, mockIngotIron)
      expect(mockFactory.parts.IngotIron).toBeDefined()
    })
    it('should prevent duplicate products', () => {
      addProductToFactory(mockFactory, mockIngotIron)

      expect(() => {
        addProductToFactory(mockFactory, mockIngotIron)
      }).toThrow()
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
      addProductToFactory(mockFactory, mockIngotIron)
      addProductToFactory(mockFactory, mockIngotCopper)
    })
    it('should throw if the recipe could not be found', () => {
      mockFactory.products[0].recipe = 'NotARecipe'
      expect(() => {
        calculateProducts(mockFactory, mockGameData)
      }).toThrow()
    })
    it('should calculate the products and produce the correct part info', () => {
      calculateProducts(mockFactory, mockGameData)

      // Expect the parts to exist
      expect(mockFactory.parts.IronIngot).toBeDefined()
      expect(mockFactory.parts.CopperIngot).toBeDefined()

      // Expect the parts to have the correct amount of supply data
      expect(mockFactory.parts.IronIngot.amountSuppliedViaProduction).toBe(123)
      expect(mockFactory.parts.IronIngot.amountSupplied).toBe(123)
      expect(mockFactory.parts.IronIngot.amountRemaining).toBe(-123)
      expect(mockFactory.parts.IronIngot.satisfied).toBe(true)

      // Expect the raw resources to exist
      expect(mockFactory.rawResources.OreIron).toBeDefined()
      expect(mockFactory.rawResources.OreCopper).toBeDefined()
      expect(mockFactory.parts.OreIron).toBeDefined()
      expect(mockFactory.parts.OreCopper).toBeDefined()
      // Expect the raw resources to have the correct amounts
      expect(mockFactory.rawResources.OreIron.amount).toBe(123)
      expect(mockFactory.rawResources.OreCopper.amount).toBe(123)

      // Expect the rawResource data to be correct
      expect(mockFactory.rawResources.OreIron.name).toBe('Iron Ore')
      expect(mockFactory.parts.OreIron.isRaw).toBe(true)

      // Expect the product to have the correct amount of requirement data
      expect(mockFactory.products[0].requirements.OreIron.amount).toBe(123)
    })
    it('should properly calculate metrics when two products require the same ingredient', () => {
      mockIngotIron.amount = 100
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

      // Reset the mock factory, we want very specific detail here
      mockFactory.products = []
      mockFactory.parts = {}

      // Add the product that's being used
      addProductToFactory(mockFactory, mockIngotIron)

      // Add the products being made
      addProductToFactory(mockFactory, mockProductIronPlate)
      addProductToFactory(mockFactory, mockProductIronRod)

      calculateProducts(mockFactory, mockGameData)

      // Expect the ingredient requirements to be correct
      // Iron Plate requires 3 Iron Ingots /i, so 300 Iron Ingots are required
      // Iron Rod requires 1 Iron Ingot /i, so 100 Iron Ingots are required
      // Totalling 400 Iron Ingots
      expect(mockFactory.parts.IronIngot.amountRequired).toBe(400)

      // Expect the calculation to be correct
      expect(mockFactory.parts.IronIngot.amountSupplied).toBe(100)
      expect(mockFactory.parts.IronIngot.amountRemaining).toBe(300)
      expect(mockFactory.parts.IronIngot.satisfied).toBe(false)
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
      calculateProducts(mockFactory, mockGameData)
      calculateByProducts(mockFactory, mockGameData)

      expect(mockFactory.products[0].byProducts).toHaveLength(0)
    })
    it('should calculate byproducts', () => {
      const mockProductWithByProducts = {
        id: 'LiquidFuel',
        amount: 100,
        recipe: 'LiquidFuel',
      }

      addProductToFactory(mockFactory, mockProductWithByProducts)
      calculateProducts(mockFactory, mockGameData)
      calculateByProducts(mockFactory, mockGameData)

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
})
