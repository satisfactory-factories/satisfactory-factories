// This setup has the Wire factory configured where there are demands set upon Wire, which is also being used internally and it's not producing enough.
// Issue #107 meant that the exports would not display wire as the surplus was eliminated.
// Exports should show wire at a 290/min deficit and should prompt the user to fix.

import { Factory } from '@/interfaces/planner/FactoryInterface'

import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

const copperIngotFac = newFactory('Copper Ingots')
const wireFac = newFactory('Wire')
const statorFac = newFactory('Stators')

// You can construct this however you wish, but try to keep it mostly consistent.
export const internalProductionDeficitPlan = (): Factory[] => {
  const factories = [
    copperIngotFac,
    wireFac,
    statorFac,
  ]
  addProductsToFactories()
  addImportsToFactories()
  return factories
}

const addProductsToFactories = () => {
  addProductToFactory(copperIngotFac, {
    id: 'CopperIngot',
    amount: 340,
    recipe: 'IngotCopper',
  })
  addProductToFactory(wireFac, {
    id: 'Wire',
    amount: 680, // Total demands on this product is 800 from Cable, 170 from Stators = 970, deficit of 290
    recipe: 'Wire',
  })
  addProductToFactory(wireFac, {
    id: 'Cable',
    amount: 400,
    recipe: 'Cable',
  })
}

const addImportsToFactories = () => {
  addInputToFactory(wireFac, {
    factoryId: copperIngotFac.id,
    outputPart: 'CopperIngot',
    amount: 340,
  })

  addInputToFactory(statorFac, {
    factoryId: wireFac.id,
    outputPart: 'Wire',
    amount: 170,
  })
}
