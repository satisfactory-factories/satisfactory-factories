import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

export const createScenario273 = (): { getFactories: () => Factory[] } => {
  // Local variables to ensure a fresh instance on every call
  const fac1 = newFactory('Factory 1')
  const fac2 = newFactory('factory 2')

  // Store factories in an array
  const factories = [fac1, fac2]

  // Add products and imports
  addProductToFactory(fac1, {
    id: 'IronPlateReinforced',
    amount: 1,
    recipe: 'IronPlateReinforced',
  })

  addProductToFactory(fac2, {
    id: 'IronPlate',
    amount: 1,
    recipe: 'IronPlate',
  })
  addProductToFactory(fac2, {
    id: 'Screw',
    amount: 1,
    recipe: 'Screw',
  })
  addInputToFactory(fac1, {
    factoryId: fac2.id,
    outputPart: 'IronPlate',
    amount: 6,
  })

  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
