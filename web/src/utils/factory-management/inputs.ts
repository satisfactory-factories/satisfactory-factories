// This simply loops through all the inputs and adds them to the parts object.
import { createNewPart } from '@/utils/factory-management/common'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { calculatePartMetrics } from '@/utils/factory-management/satisfaction'

export const addInputToFactory = (
  factory: Factory, options: {
    factoryId: number | null,
    outputPart: string | null,
    amount: number,
  }
) => {
  // Find any factory that has the same factoryId, outputPart combo as we're trying to add, if there is any throw an error
  if (factory.inputs.find(input => input.factoryId === options.factoryId && input.outputPart === options.outputPart)) {
    throw new Error(`addInputToFactory: Input with factoryId ${options.factoryId} and outputPart ${options.outputPart} already exists in factory ${factory.id}`)
  }

  factory.inputs.push({
    factoryId: options.factoryId,
    outputPart: options.outputPart,
    amount: options.amount,
  })
}

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
