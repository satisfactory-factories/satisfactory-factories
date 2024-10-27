import { beforeEach, describe, expect, test } from '@jest/globals'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { createMockFactory } from '@/utils/factory-management/mocks/mock-factory'
import { calculateHasProblem } from '@/utils/factory-management/problems'

describe('calculateHasProblem', () => {
  let mockFactory: Factory

  beforeEach(() => {
    mockFactory = createMockFactory('Test Factory')
    mockFactory.dependencies = {
      requests: {
        CopperOre: [
          {
            part: 'CopperOre',
            amount: 1234,
          },
        ],
      },
      metrics: {
        CopperOre: {
          part: 'CopperOre',
          request: 1234,
          supply: 1000,
          difference: 234,
          isRequestSatisfied: false,
        },
      },
    }
  })

  test('should mark the factory has having a problem requirements are not satisfied', () => {
    mockFactory.requirementsSatisfied = false

    calculateHasProblem([mockFactory])
    expect(mockFactory.hasProblem).toBe(true)
  })

  test('should mark the factory has having a problem if not all dependency requirements are satisfied', () => {
    mockFactory.requirementsSatisfied = true

    calculateHasProblem([mockFactory])
    expect(mockFactory.hasProblem).toBe(true)
  })

  test('should mark the factory has no problem if all dependencies are satisfied', () => {
    mockFactory.requirementsSatisfied = true

    mockFactory.dependencies.metrics.CopperOre.isRequestSatisfied = true

    calculateHasProblem([mockFactory])
    expect(mockFactory.hasProblem).toBe(false)
  })
})
