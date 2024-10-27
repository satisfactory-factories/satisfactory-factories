// Loop through all factories, checking their inputs and building a dependency tree.
import { Factory } from '@/interfaces/planner/FactoryInterface'

export const calculateDependencies = (factories: Factory[]): void => {
  // First, remove the current dependencies for each factory to ensure we're not orphaning.
  factories.forEach(factory => {
    factory.dependencies = {
      requests: {},
      metrics: {},
    }
  })

  // Second, rebuild the dependencies.
  factories.forEach(factory => {
    factory.inputs.forEach(input => {
      // Handle the case where the user is mid-way selecting an input.
      if (input.factoryId === 0 || !input.outputPart) {
        return
      }

      const requestedFactory = factories.find(fac => fac.id === input.factoryId)
      if (!requestedFactory) {
        console.error(`Factory with ID ${input.factoryId} not found.`)

        // Remove it from the inputs if this is the case as it's invalid.
        factory.inputs = factory.inputs.filter(i => i !== input)

        return
      }

      if (!requestedFactory.dependencies.requests[factory.id]) {
        requestedFactory.dependencies.requests[factory.id] = []
      }

      requestedFactory.dependencies.requests[factory.id].push({
        part: input.outputPart,
        amount: input.amount,
      })
    })
  })
}

// Create data helper classes to visualize the dependencies in the UI nicely.
export const calculateDependencyMetrics = (factories: Factory[]) => {
  factories.forEach(factory => {
    Object.keys(factory.dependencies.requests).forEach(reqFac => {
      const requests = factory.dependencies.requests[reqFac]
      requests.forEach(request => {
        const part = request.part
        const metrics = factory.dependencies.metrics

        if (!factory.surplus[part]) {
          console.warn(`calculateDependencyMetrics: Could not find a surplus for part ${part}.`, part)
        }

        if (!metrics[part]) {
          metrics[part] = {
            part,
            request: 0,
            supply: factory.surplus[part]?.amount ?? 0,
            isRequestSatisfied: false,
            difference: 0,
          }
        }

        metrics[part].request += request.amount
        metrics[part].isRequestSatisfied = metrics[part].supply >= metrics[part].request
        metrics[part].difference = metrics[part].supply - metrics[part].request
      })
    })
  })
}
