import { Factory } from '@/interfaces/planner/FactoryInterface'

export const addSurplus = (factory: Factory, options: {
  part: string,
  amount: number,
}) => {
  if (!factory.surplus[options.part]) {
    factory.surplus[options.part] = {
      amount: 0,
    }
  }

  factory.surplus[options.part].amount += options.amount
}

export const calculateSurplus = (factory: Factory) => {
  factory.surplus = {} // Avoids orphaning

  // Loop through each part list, and check if there's any surplus
  Object.keys(factory.parts).forEach(partKey => {
    const part = factory.parts[partKey]

    if (!part) {
      console.error(`Part listing is missing for part ${partKey}`)
    }

    // If the amount remaining is less than 0, we have a surplus.
    if (part.amountRemaining < 0) {
      addSurplus(factory, {
        part: partKey,
        amount: Math.abs(part.amountRemaining),
      })
    }
  })
}
