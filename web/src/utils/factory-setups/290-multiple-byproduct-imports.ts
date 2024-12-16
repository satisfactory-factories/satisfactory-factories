import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

export const create290Scenario = (): { getFactories: () => Factory[] } => {
  const ironIngotFac = newFactory('Iron Ingots', 0, 1)
  const ironIngotFac2 = newFactory('Iron Ingots 2', 1, 2)
  const ironPlateFac = newFactory('Iron Plates', 2, 3)

  const factories = [ironIngotFac, ironIngotFac2, ironPlateFac]

  // Add products and imports
  const addProductsToFactories = () => {
    addProductToFactory(ironIngotFac, {
      id: 'IronIngot',
      amount: 100,
      recipe: 'IngotIron',
    })
    addProductToFactory(ironIngotFac2, {
      id: 'IronIngot',
      amount: 100,
      recipe: 'IngotIron',
    })

    addProductToFactory(ironPlateFac, {
      id: 'IronPlate',
      amount: 100,
      recipe: 'IronPlate',
    })
  }

  const addImportsToFactories = () => {
    addInputToFactory(ironPlateFac, {
      factoryId: ironIngotFac.id,
      outputPart: 'IronIngot',
      amount: 100,
    })
    addInputToFactory(ironPlateFac, {
      factoryId: ironIngotFac2.id,
      outputPart: null, // Purposefully not set a part here, as this contains the bug
      amount: 0,
    })
  }

  // Execute setup functions
  addProductsToFactories()
  addImportsToFactories()

  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
