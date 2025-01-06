import { beforeEach, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories, newFactory } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { addProductToFactory } from '@/utils/factory-management/products'
import { addInputToFactory } from '@/utils/factory-management/inputs'

let fac1: Factory
let fac2: Factory
let factories: Factory[] = []

// https://github.com/satisfactory-factories/application/issues/273
describe('273 import issue', () => {
  beforeEach(() => {
    fac1 = newFactory('Factory 1', 1, 1)
    fac2 = newFactory('Factory 2', 2, 2)

    factories = [fac1, fac2]

    // Add products and imports
    addProductToFactory(fac1, {
      id: 'IronPlateReinforced',
      amount: 1,
      recipe: 'IronPlateReinforced',
    })
    addProductToFactory(fac2, {
      id: 'IronPlate',
      amount: 1,
      recipe: 'IronPlate',
    })
    addProductToFactory(fac2, {
      id: 'IronScrew',
      amount: 1,
      recipe: 'Screw',
    })

    addInputToFactory(fac1, {
      factoryId: fac2.id,
      outputPart: 'IronPlate',
      amount: 6,
    })

    calculateFactories(factories, gameData) // Needed to calculate part metrics, dependencies will not work otherwise.
  })

  it('should have added an import to factory 1', () => {
    expect(fac1.inputs).toHaveLength(1)
    expect(fac1.inputs[0].outputPart).toBe('IronPlate')
    expect(fac1.inputs[0].amount).toBe(6)
  })
  it('should have created dependency metrics on factory 2', () => {
    expect(fac2.dependencies.metrics.IronPlate).toEqual({
      part: 'IronPlate',
      request: 6,
      supply: 1,
      isRequestSatisfied: false,
      difference: -5,
    })
  })
})
