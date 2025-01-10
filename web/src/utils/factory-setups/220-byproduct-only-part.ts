import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'

// https://github.com/satisfactory-factories/application/issues/220
// Share link: https://satisfactory-factories.app/share/beautiful-important-man // Love it :D
export const create220Scenario = (): { getFactories: () => Factory[] } => {
  const mockFactory = newFactory('Oil', 0, 1)

  // Store factories in an array
  const factories = [mockFactory]

  // Add products and imports
  addProductToFactory(mockFactory, {
    id: 'Plastic',
    amount: 840,
    recipe: 'Plastic',
  })
  addProductToFactory(mockFactory, {
    id: 'Rubber',
    amount: 240,
    recipe: 'Rubber',
  })
  addProductToFactory(mockFactory, {
    id: 'LiquidFuel',
    amount: 473,
    recipe: 'ResidualFuel',
  })
  addProductToFactory(mockFactory, {
    id: 'SteelPlateReinforced',
    amount: 30,
    recipe: 'EncasedIndustrialBeam',
  })

  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
