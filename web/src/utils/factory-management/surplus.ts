import { Factory } from '@/interfaces/planner/FactoryInterface'

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
      if (!factory.surplus[partKey]) {
        factory.surplus[partKey] = {
          amount: 0,
          surplusHandling: 'export',
        }
      }

      factory.surplus[partKey].amount += Math.abs(part.amountRemaining)
    }
  })
}
