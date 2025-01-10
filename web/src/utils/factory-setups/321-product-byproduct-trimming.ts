import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'

export const create321Scenario = (): { getFactories: () => Factory[] } => {
  const issueFactory = newFactory('Byproduct balancing')

  // Store factories in an array
  const factories = [issueFactory]

  // Add products and imports
  addProductToFactory(issueFactory, {
    id: 'PolymerResin',
    amount: 260,
    recipe: 'Alternate_PolymerResin',
    displayOrder: 0,
  })
  addProductToFactory(issueFactory, {
    id: 'HeavyOilResidue',
    amount: 120, // Should trim to 60, as 40 is made by polymer resin
    recipe: 'Alternate_HeavyOilResidue',
    displayOrder: 1,
  })
  addProductToFactory(issueFactory, {
    id: 'Plastic',
    amount: 40,
    recipe: 'Plastic',
    displayOrder: 2,
  })
  addProductToFactory(issueFactory, {
    id: 'Rubber',
    amount: 150,
    recipe: 'ResidualRubber',
    displayOrder: 3,
  })
  addProductToFactory(issueFactory, {
    id: 'PetroleumCoke',
    amount: 300,
    recipe: 'PetroleumCoke',
    displayOrder: 4,
  })

  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
