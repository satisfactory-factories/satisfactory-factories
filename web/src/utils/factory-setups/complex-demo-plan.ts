import { Factory } from '@/interfaces/planner/FactoryInterface'
import { addPowerProducerToFactory, addProductToFactory } from '@/utils/factory-management/products'
import { findFacByName, newFactory } from '@/utils/factory-management/factory'
import { addInputToFactory } from '@/utils/factory-management/inputs'

// This is a more complex setup with multiple factories with dependencies going in a straight chain from Computers to Ingots and Oil Processing.
// This setup is used to test the more complex factory management functions.
// Copper Basics has a deliberate shortage of Copper Ingots to highlight that functionality to new users.
export const complexDemoPlan = (): { getFactories: () => Factory[] } => {
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
      amount: 400,
      recipe: 'Wire',
    })
    addProductToFactory(copperBasicsFac, {
      id: 'Cable',
      amount: 200,
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
      amount: 320, // Deliberate shortage, should be 520.
    })

    const circuitBoardsFac = findFacByName('Circuit Boards', factories)
    const oilProcessingFac = findFacByName('Oil Processing', factories)
    addInputToFactory(circuitBoardsFac, {
      factoryId: copperBasicsFac.id,
      outputPart: 'CopperSheet',
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

  const addPowerToFactories = () => {
    const oilFac = findFacByName('Oil Processing', factories)
    addPowerProducerToFactory(oilFac, {
      building: 'generatorfuel',
      powerAmount: 500,
      recipe: 'GeneratorFuel_LiquidFuel',
      updated: 'power',
    })
  }

  // Apply setup steps
  addProductsToFactories()
  addImportsToFactories()
  addPowerToFactories()

  // Return an object with a method to access the configured factories
  return {
    getFactories: () => factories,
  }
}
