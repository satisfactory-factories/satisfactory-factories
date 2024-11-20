import { Factory } from '@/interfaces/planner/FactoryInterface'
import { addProductToFactory } from '@/utils/factory-management/products'
import { findFacByName, newFactory } from '@/utils/factory-management/factory'
import { addInputToFactory } from '@/utils/factory-management/inputs'

// Programmatically create a set of factories with products and imports, which keeps the demo data consistent and in line with changes to the data structure.
export const demoFactories = (): Factory[] => {
  const factories = constructFactories()
  addProductsToFactories(factories)
  addImportsToFactories(factories)
  return factories
}

const constructFactories = (): Factory[] => {
  return [
    newFactory('Oil Processing'), // This should also show a factory with a byproduct, which if not dealt with will cause a blockage
    newFactory('Copper Ingots'),
    newFactory('Copper Basics'),
    newFactory('Circuit Boards'),
    newFactory('Computers (end product)'),
  ]
}

const addProductsToFactories = (factories: Factory[]) => {
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

const addImportsToFactories = (factories: Factory[]) => {
  const copperIngotsFac = findFacByName('Copper Ingots', factories)
  const copperBasicsFac = findFacByName('Copper Basics', factories)
  addInputToFactory(copperBasicsFac, {
    factoryId: copperIngotsFac.id,
    outputPart: 'CopperIngot',
    amount: 320,
  })

  const circuitBoardsFac = findFacByName('Circuit Boards', factories)
  const oilProcessingFac = findFacByName('Oil Processings', factories)
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
