import { beforeEach, describe, expect, test } from '@jest/globals'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { addMockFactoryProduct, createMockFactory } from '@/utils/factory-management/mocks/mock-factory'
import { createNewPart } from '@/utils/factory-management/common'

describe('commonFactoryCalculations', () => {
  let mockFactory: Factory

  beforeEach(() => {
    mockFactory = createMockFactory('Test Factory')
    addMockFactoryProduct(mockFactory, {
      id: 'CompactedCoal',
      amount: 1234,
      recipe: 'CompactedCoal',
    })
  })

  describe('createNewPart', () => {
    test('should create a new part', () => {
      const part = 'NewPart'

      createNewPart(mockFactory, part)

      expect(mockFactory.parts[part]).toBeDefined()
    })

    test('should not overwrite existing parts', () => {
      const part = 'CompactedCoal'

      createNewPart(mockFactory, part)

      expect(mockFactory.parts[part].amountRequired).toBe(1234)
    })
  })
})
