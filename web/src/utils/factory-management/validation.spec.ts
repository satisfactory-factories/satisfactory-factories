import { describe, expect, it } from 'vitest'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { validateFactories } from '@/utils/factory-management/validation'
import { addInputToFactory } from '@/utils/factory-management/inputs'

describe('validation', () => {
  it('should successfully detect and delete an invalid factory input', () => {
    const mockFactory: Factory = newFactory('Iron Ingots')

    mockFactory.inputs.push({
      factoryId: 123456,
      outputPart: 'IronOre',
      amount: 123,
    })

    expect(() => {
      validateFactories([mockFactory])
    }).toThrow()
    expect(mockFactory.inputs.length).toBe(0)
  })

  it('should successfully detect and delete an invalid dependency', () => {
    const mockFactory: Factory = newFactory('Iron Ingots')

    mockFactory.dependencies.requests[2346] = [{
      requestingFactoryId: 123456,
      amount: 123,
      part: 'Foo',
    }]

    expect(() => {
      validateFactories([mockFactory])
    }).toThrow()
    expect(mockFactory.dependencies.requests).toEqual({})
  })

  it('should not inadvertently delete valid factory inputs', () => {
    const mockFactory: Factory = newFactory('Iron Ingots')
    const validFactory: Factory = newFactory('Some Factory')

    addInputToFactory(mockFactory, {
      factoryId: validFactory.id,
      outputPart: 'IronOre',
      amount: 123,
    })

    addInputToFactory(mockFactory, {
      factoryId: 123456,
      outputPart: 'MadeUpPart',
      amount: 123,
    })

    expect(() => {
      validateFactories([mockFactory, validFactory])
    }).toThrow()
    expect(mockFactory.inputs.length).toBe(1)
    expect(mockFactory.inputs[0].factoryId).toBe(validFactory.id)
  })

  it('should not inadvertently delete valid dependencies', () => {
    const mockFactory: Factory = newFactory('Iron Ingots')
    const validFactory: Factory = newFactory('Some Factory')

    mockFactory.dependencies.requests[validFactory.id] = []
    mockFactory.dependencies.requests[validFactory.id].push({
      requestingFactoryId: validFactory.id,
      part: 'IronOre',
      amount: 123,
    })
    mockFactory.dependencies.requests[12345] = []
    mockFactory.dependencies.requests[12345].push({
      requestingFactoryId: 12345,
      part: 'IronOre',
      amount: 123,
    })

    expect(() => {
      validateFactories([mockFactory, validFactory])
    }).toThrow()

    expect(mockFactory.dependencies.requests[validFactory.id]).toBeDefined()
    expect(mockFactory.dependencies.requests[123456]).toBeUndefined()
  })
})
