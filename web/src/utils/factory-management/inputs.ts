// This simply loops through all the inputs and adds them to the parts object.
import { calculatePartMetrics, createNewPart } from '@/utils/factory-management/common'
import { Factory } from '@/interfaces/planner/FactoryInterface'

export const calculateInputs = (factory: Factory) => {
  factory.inputs.forEach(input => {
    if (!input.outputPart) {
      console.error('calculateInputs: Output part is missing from input.', input)
      return
    }
    createNewPart(factory, input.outputPart)
    factory.parts[input.outputPart].amountSuppliedViaInput += input.amount
    calculatePartMetrics(factory, input.outputPart)
  })
}
