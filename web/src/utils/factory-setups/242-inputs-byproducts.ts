import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

// https://github.com/satisfactory-factories/application/issues/242
// https://satisfactory-factories.app/share/helpful-sweet-crowd
export const create242Scenario = (): { getFactories: () => Factory[] } => {
  const issueFactory = newFactory('DMR trimming issue', 0, 1)
  const dmrProducer = newFactory('DMR producer', 1, 2)

  // Store factories in an array
  const factories = [issueFactory, dmrProducer]

  // Add products and imports
  addProductToFactory(issueFactory, {
    id: 'DarkMatter',
    amount: 6,
    recipe: 'DarkMatter',
  })
  addProductToFactory(issueFactory, {
    id: 'QuantumOscillator',
    amount: 1,
    recipe: 'SuperpositionOscillator',
  })

  addProductToFactory(dmrProducer, {
    id: 'DarkEnergy',
    amount: 40,
    recipe: 'DarkEnergy',
  })
  addProductToFactory(dmrProducer, {
    id: 'SAMIngot',
    amount: 20,
    recipe: 'IngotSAM',
  })
  addInputToFactory(issueFactory, {
    factoryId: dmrProducer.id,
    outputPart: 'DarkEnergy',
    amount: 40,
  })

  // Return an object with a method to access the factories
  return {
    getFactories: () => factories, // Expose factories as a method
  }
}
