// Use this file to create new setups.

import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

const ironIngotFac = newFactory('Iron Ingots')
const ironPlateFac = newFactory('Iron Plates')

// You can construct this however you wish, but try to keep it mostly consistent.
export const template = (): Factory[] => {
  const factories = [
    ironIngotFac,
    ironPlateFac,
  ]
  addProductsToFactories()
  addImportsToFactories()
  return factories
}

const addProductsToFactories = () => {
  addProductToFactory(ironIngotFac, {
    id: 'IronIngot',
    amount: 100,
    recipe: 'IronIngot',
  })

  addProductToFactory(ironPlateFac, {
    id: 'IronPlate',
    amount: 100,
    recipe: 'IronPlate',
  })
}

const addImportsToFactories = () => {
  addInputToFactory(ironPlateFac, {
    factoryId: ironPlateFac.id,
    outputPart: 'IronIngot',
    amount: 100,
  })
}
