import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

export const create315Scenario = (): { getFactories: () => Factory[] } => {
  // Local variables to ensure a fresh instance on every call
  const copperIngotsFac = newFactory('Copper Ingots Fac', 0)
  const copperPartsFac = newFactory('Copper Parts Fac', 1)
  const aluminiumPartsFac = newFactory('Aluminium Parts Fac', 2)

  // Store factories in an array
  const factories = [copperIngotsFac, copperPartsFac, aluminiumPartsFac]

  // Add products, producers, and imports
  const addProductsToFactories = () => {
    addProductToFactory(copperIngotsFac, {
      id: 'CopperIngot',
      amount: 300,
      recipe: 'IngotCopper',
    })
    addProductToFactory(copperPartsFac, {
      id: 'CopperSheet',
      amount: 100,
      recipe: 'CopperSheet',
    })
    addProductToFactory(aluminiumPartsFac, {
      id: 'AluminumPlateReinforced',
      amount: 10,
      recipe: 'HeatSink',
    })
    addProductToFactory(aluminiumPartsFac, {
      id: 'AluminumPlate',
      amount: 50,
      recipe: 'AluminumSheet',
    })
  }

  const addImportsToFactories = () => {
    addInputToFactory(copperPartsFac, {
      factoryId: copperIngotsFac.id,
      outputPart: 'CopperIngot',
      amount: 200,
    })

    addInputToFactory(aluminiumPartsFac, {
      factoryId: copperIngotsFac.id,
      outputPart: 'CopperIngot',
      amount: 20,
    })

    // INVALID INPUT and should be removed by code
    addInputToFactory(aluminiumPartsFac, {
      factoryId: copperPartsFac.id,
      outputPart: 'CopperIngot',
      amount: 100,
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
