import { beforeEach, describe, expect, it } from '@jest/globals'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addDependency, constructDependencies, removeFactoryDependants } from '@/utils/factory-management/dependencies'
import { addInputToFactory } from '@/utils/factory-management/inputs'

describe('dependencies', () => {
  let factories: Factory[] = []
  let mockFactory: Factory
  let mockDependantFactory: Factory

  beforeEach(() => {
    mockFactory = newFactory('Iron Ingots')
    mockDependantFactory = newFactory('Iron Plates')
    factories = [mockFactory, mockDependantFactory]
  })

  describe('addDependency', () => {
    it('should add a dependency between two factories', () => {
      const input = {
        factoryId: mockFactory.id,
        outputPart: 'IronIngot',
        amount: 900,
      }

      expect(() => {
        addDependency(mockFactory, mockDependantFactory, input)
      }).not.toThrow()

      expect(mockDependantFactory.dependencies.requests[mockFactory.id].length).toBe(1)

      expect(mockDependantFactory.dependencies.requests[mockFactory.id][0].part).toBe('IronIngot')
    })

    it('should throw an error if output part is not supplied', () => {
      const input = {
        factoryId: mockFactory.id,
        outputPart: '',
        amount: 900,
      }

      expect(() => {
        addDependency(mockFactory, mockDependantFactory, input)
      }).toThrow()
    })

    it('should deny adding a dependency if one already exists', () => {
      const input = {
        factoryId: mockFactory.id,
        outputPart: 'IronIngot',
        amount: 900,
      }
      const input2 = {
        factoryId: mockFactory.id,
        outputPart: 'IronIngot',
        amount: 900,
      }

      expect(() => {
        addDependency(mockFactory, mockDependantFactory, input)
        addDependency(mockFactory, mockDependantFactory, input2)
      }).toThrow()
    })
  })

  describe('removeFactoryDependants', () => {
    it('should remove dependants of the factory', () => {
      const input = {
        factoryId: mockFactory.id,
        outputPart: 'IronIngot',
        amount: 900,
      }
      const input2 = {
        factoryId: mockFactory.id,
        outputPart: 'CopperIngot',
        amount: 900,
      }

      addInputToFactory(mockDependantFactory, input)
      addInputToFactory(mockDependantFactory, input2)
      constructDependencies(factories)
      removeFactoryDependants(mockFactory, factories)

      // Assume the tests work and the dependency is added
      // Now check if the dependant is removed
      expect(mockFactory.dependencies.requests[mockFactory.id]).toBe(undefined)

      // And also check if the input has been filtered from the dependant
      expect(mockDependantFactory.inputs.length).toBe(0)
    })
  })
})
