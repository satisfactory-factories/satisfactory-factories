import { beforeEach, describe, expect, test } from '@jest/globals'
import { calculateFactorySatisfaction } from './satisfaction'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { newFactory } from '@/utils/factory-management/factory'
import { addProductToFactory } from '@/utils/factory-management/products'

describe('calculateFactorySatisfaction', () => {
  let mockFactory: Factory

  beforeEach(() => {
    mockFactory = newFactory('Test Factory')
    addProductToFactory(mockFactory, {
      id: 'CompactedCoal',
      amount: 1234,
      recipe: 'CompactedCoal',
    })
  })

  test('should mark factory as satisfied if all parts are satisfied', () => {
    mockFactory.parts.CompactedCoal.satisfied = true
    calculateFactorySatisfaction(mockFactory)
    expect(mockFactory.requirementsSatisfied).toBe(true)
  })

  test('should mark factory as not satisfied if any part is not satisfied', () => {
    calculateFactorySatisfaction(mockFactory)
    expect(mockFactory.requirementsSatisfied).toBe(false)
  })

  test('should mark factory as satisfied if there are no products', () => {
    mockFactory.products = []
    calculateFactorySatisfaction(mockFactory)
    expect(mockFactory.requirementsSatisfied).toBe(true)
  })
})
