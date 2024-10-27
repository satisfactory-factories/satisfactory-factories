// Calculate the remaining amount of parts required after all inputs and internal products are accounted for.
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculatePartMetrics } from '@/utils/factory-management/common'

export const calculateFactorySatisfaction = (factory: Factory) => {
  // Let's make absolutely sure the factory part metrics are right
  Object.keys(factory.parts).forEach(part => {
    calculatePartMetrics(factory, part)
  })

  // If factory has no products there is nothing for us to do, so mark as satisfied.
  if (factory.products.length === 0) {
    factory.requirementsSatisfied = true
    return
  }

  // Now check if all requirements are satisfied and flag so if it is.
  factory.requirementsSatisfied = Object.keys(factory.parts).every(part => factory.parts[part].satisfied)
}
