import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

// https://github.com/satisfactory-factories/application/issues/251
// Share link: https://satisfactory-factories.app/share/microscopic-gifted-vase
export const create251Scenario = (): { getFactories: () => Factory[] } => {
  const factoryA = newFactory('Factory A', 0, 1)
  const factoryB = newFactory('Factory B', 1, 2)
  const factoryC = newFactory('Factory C', 2, 3)

  // Store factories in an array
  const factories = [factoryA, factoryB, factoryC]

  // Add products and imports
  addProductToFactory(factoryA, {
    id: 'CompactedCoal',
    amount: 540,
    recipe: 'Alternate_EnrichedCoal',
  })
  addProductToFactory(factoryB, {
    id: 'CompactedCoal',
    amount: 450,
    recipe: 'Alternate_EnrichedCoal',
  })
  addProductToFactory(factoryC, {
    id: 'LiquidFuel',
    amount: 1200,
    recipe: 'LiquidFuel',
  })
  addProductToFactory(factoryC, {
    id: 'LiquidTurboFuel',
    amount: 1000,
    recipe: 'Alternate_Turbofuel',
  })

  addInputToFactory(factoryC, {
    factoryId: factoryA.id,
    outputPart: 'CompactedCoal',
    amount: 540,
  })
  addInputToFactory(factoryC, {
    factoryId: factoryB.id,
    outputPart: 'CompactedCoal',
    amount: 450,
  })

  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
