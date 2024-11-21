import { Factory } from '@/interfaces/planner/FactoryInterface'
import { addProductToFactory } from '@/utils/factory-management/products'
import { findFacByName, newFactory } from '@/utils/factory-management/factory'
import { addInputToFactory } from '@/utils/factory-management/inputs'

// A factory function to encapsulate the creation of demo factories
export const createDemo = (): { getFactories: () => Factory[] } => {
  // Initialize factories
  const factories = [
    newFactory('Oil Processing'), // Factory with a byproduct
    newFactory('Copper Ingots'),
    newFactory('Copper Basics'),
    newFactory('Circuit Boards'),
    newFactory('Computers (end product)'),
  ]

  // Private methods to configure the factories
  const addProductsToFactories = () => {
    const oilFac = findFacByName('Oil Processing', factories)
    addProductToFactory(oilFac, {
      id: 'Plastic',
      amount: 640,
      recipe: 'Plastic',
    })
    addProductToFactory(oilFac, {
      id: 'LiquidFuel',
      amount: 40,
      recipe: 'ResidualFuel',
    })

    const copperIngotsFac = findFacByName('Copper Ingots', factories)
    addProductToFactory(copperIngotsFac, {
      id: 'CopperIngot',
      amount: 640,
      recipe: 'IngotCopper',
    })

    const copperBasicsFac = findFacByName('Copper Basics', factories)
    addProductToFactory(copperBasicsFac, {
      id: 'Wire',
      amount: 320,
      recipe: 'Wire',
    })
    addProductToFactory(copperBasicsFac, {
      id: 'Cable',
      amount: 160,
      recipe: 'Cable',
    })
    addProductToFactory(copperBasicsFac, {
      id: 'CopperSheet',
      amount: 160,
      recipe: 'CopperSheet',
    })

    const circuitBoardsFac = findFacByName('Circuit Boards', factories)
    addProductToFactory(circuitBoardsFac, {
      id: 'CircuitBoard',
      amount: 80,
      recipe: 'CircuitBoard',
    })

    const computersFac = findFacByName('Computers (end product)', factories)
    addProductToFactory(computersFac, {
      id: 'Computer',
      amount: 20,
      recipe: 'Computer',
    })
  }

  const addImportsToFactories = () => {
    const copperIngotsFac = findFacByName('Copper Ingots', factories)
    const copperBasicsFac = findFacByName('Copper Basics', factories)
    addInputToFactory(copperBasicsFac, {
      factoryId: copperIngotsFac.id,
      outputPart: 'CopperIngot',
      amount: 320,
    })

    const circuitBoardsFac = findFacByName('Circuit Boards', factories)
    const oilProcessingFac = findFacByName('Oil Processing', factories)
    addInputToFactory(circuitBoardsFac, {
      factoryId: copperBasicsFac.id,
      outputPart: 'Cable',
      amount: 160,
    })
    addInputToFactory(circuitBoardsFac, {
      factoryId: oilProcessingFac.id,
      outputPart: 'Plastic',
      amount: 320,
    })

    const computersFac = findFacByName('Computers (end product)', factories)
    addInputToFactory(computersFac, {
      factoryId: oilProcessingFac.id,
      outputPart: 'Plastic',
      amount: 320,
    })
    addInputToFactory(computersFac, {
      factoryId: copperBasicsFac.id,
      outputPart: 'Cable',
      amount: 160,
    })
    addInputToFactory(computersFac, {
      factoryId: circuitBoardsFac.id,
      outputPart: 'CircuitBoard',
      amount: 80,
    })
  }

  // Apply setup steps
  addProductsToFactories()
  addImportsToFactories()

  // Return an object with a method to access the configured factories
  return {
    getFactories: () => factories,
  }
}
