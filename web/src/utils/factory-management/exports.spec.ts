import { beforeEach, describe, expect, it } from '@jest/globals'
import { calculateFactories, newFactory } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { addInputToFactory } from '@/utils/factory-management/inputs'
import { addProductToFactory } from '@/utils/factory-management/products'

let ironIngotFac = newFactory('Iron Ingots')
let ironPlateFac = newFactory('Iron Plates')

describe('calculateExports', () => {
  beforeEach(() => {
    // Reset the mocks
    ironIngotFac = newFactory('Iron Ingots')
    ironPlateFac = newFactory('Iron Plates')

    addProductToFactory(ironIngotFac, {
      id: 'IronIngot',
      amount: 100,
      recipe: 'IngotIron', // I love this game's recipe naming being inconsistent
    })

    addProductToFactory(ironPlateFac, {
      id: 'IronPlate',
      amount: 100,
      recipe: 'IronPlate',
    })
  })
  it('should not have any exports when none are set', () => {
    const factories = [ironIngotFac, ironPlateFac]

    // Run calculateFactories, we can't run calculateExports directly since there's so dependencies on other calculations
    calculateFactories(factories, gameData)

    expect(ironIngotFac.exports).toEqual({})
    expect(ironPlateFac.exports).toEqual({})
  })
  it('should calculate exports correctly under normal conditions', () => {
    const factories = [ironIngotFac, ironPlateFac]

    addInputToFactory(ironPlateFac, {
      factoryId: ironIngotFac.id,
      outputPart: 'IronIngot',
      amount: 100,
    })

    // This should have added the dependency for us, thus calculateExports should have added the export because it's a dependant.
    calculateFactories(factories, gameData)

    expect(ironPlateFac.exports).not.toEqual({})
  })
})
