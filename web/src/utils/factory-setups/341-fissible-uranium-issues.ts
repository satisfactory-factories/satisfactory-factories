import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'

// https://github.com/satisfactory-factories/application/issues/341
export const create341Scenario = (): { getFactories: () => Factory[] } => {
  const factory = newFactory('Nuclear Power', 0, 1)

  // Store factories in an array
  const factories = [factory]

  // Add products and imports
  addProductToFactory(factory, {
    id: 'NonFissibleUranium',
    amount: 1,
    recipe: 'NonFissileUranium',
  })
  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
