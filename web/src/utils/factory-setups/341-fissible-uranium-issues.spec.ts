import { beforeAll, describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculateFactories } from '@/utils/factory-management/factory'
import { gameData } from '@/utils/gameData'
import { create341Scenario } from '@/utils/factory-setups/341-fissible-uranium-issues'

let factories: Factory[]
let factory: Factory

describe('341 Scenario Plan', () => {
  beforeAll(() => {
    const templateInstance = create341Scenario()
    factories = templateInstance.getFactories()
    factory = factories[0]
    calculateFactories(factories, gameData)
  })

  it('should properly calculate Non-Fissile Uranium', () => {
    // Run calculations
    calculateFactories(factories, gameData)

    // Check the results, should have calculated properly
    expect(factory.parts.Silica.amountRequired).toBe(0.5)
    expect(factory.parts.NuclearWaste.amountRequired).toBe(0.75)
    expect(factory.parts.NitricAcid.amountRequired).toBe(0.3)
    expect(factory.parts.SulfuricAcid.amountRequired).toBe(0.3)
    expect(factory.parts.Water.amountSupplied).toBe(0.3)
    expect(factory.parts.NonFissibleUranium.amountSupplied).toBe(1)
  })
})
