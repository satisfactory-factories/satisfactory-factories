import { Factory, FactoryDependencyRequest, FactoryInput } from '@/interfaces/planner/FactoryInterface'
import { findFac } from '@/utils/factory-management/factory'

// Adds dependencies between two factories.
export const addDependency = (
  factory: Factory, // The factory that has the input
  provider: Factory, // The factory that provides the dependency
  input: FactoryInput
) => {
  if (!input.outputPart) {
    throw new Error(`addDependency: Factory ${factory.id} is attempting to add a dependency with no output part!`)
  }

  if (!provider.dependencies.requests[factory.id]) {
    provider.dependencies.requests[factory.id] = []
  }

  const requests = provider.dependencies.requests[factory.id]

  // If the factory already has a request for the same factory and part, there's an issue.
  if (requests.length > 0) {
    const existingRequest = requests.find(req => req.part === input.outputPart)
    if (existingRequest) {
      throw new Error(`addDependency: Factory ${provider.id} already has a request for part ${input.outputPart} from ${factory.id}.`)
    }
  }

  requests.push({
    requestingFactoryId: factory.id,
    part: input.outputPart,
    amount: input.amount,
  })
}

// Scans for invalid dependency requests and removes the request and the input from the erroneous factory.
export const scanForInvalidInputs = (factory: Factory, factories: Factory[]): void => {
  // If there's no requests, nothing to do.
  if (!factory.dependencies?.requests) {
    return
  }

  // Scan all requests for the factory
  Object.keys(factory.dependencies?.requests).forEach(requestedFactoryId => {
    const requests: FactoryDependencyRequest[] = factory.dependencies.requests[requestedFactoryId]

    const dependantFactory = findFac(requestedFactoryId, factories)
    // If the factory doesn't exist, somehow this data corrupted, clean it up now.
    if (!dependantFactory) {
      console.error(`Requested factory ${requestedFactoryId} not found!`)
      delete factory.dependencies.requests[requestedFactoryId]
    }

    requests.forEach(request => {
      // Check if the product exists within the factory
      const product = factory.products.find(prod => prod.id === request.part)

      // If the product does not exist, remove the dependency and the input.
      if (!product) {
        console.warn(`Factory ${factory.name} (${factory.id}) does not have the product ${request.part} requested by ${dependantFactory.name} (${dependantFactory.id}). Removing dependency and input.`)

        // Filter out the dependency request(s) for the part from the erroneous factory.
        factory.dependencies.requests[requestedFactoryId] = factory.dependencies.requests[requestedFactoryId].filter(req => req.part !== request.part)

        // If all requests from the factory have been removed, also delete the key.
        if (factory.dependencies.requests[requestedFactoryId].length === 0) {
          delete factory.dependencies.requests[requestedFactoryId]
        }

        // Delete the input from the factory that caused the issue.
        dependantFactory.inputs.forEach((input, index) => {
          if (input.factoryId === factory.id && input.outputPart === request.part) {
            dependantFactory.inputs.splice(index, 1)
          }
        })
      }
    })
  })
}

export const removeFactoryDependants = (factory: Factory, factories: Factory[]) => {
  // Remove the inputs from factories that depend on this factory
  if (factory.dependencies?.requests) {
    const dependents = factory.dependencies?.requests

    Object.keys(dependents).forEach(dependentId => {
      const dependent = findFac(dependentId, factories)
      if (!dependent) {
        console.error(`Dependent factory ${dependentId} not found!`)
        return
      }
      dependent.inputs = dependent.inputs.filter(input => input.factoryId !== factory.id)

      // Remove the dependency from the calling factory
      // Not that this massively matters as the factory is likely getting deleted
      delete factory.dependencies.requests[factory.id]
    })
  }
}

// Loop through all factories, checking their inputs and building a dependency tree.
export const constructDependencies = (factories: Factory[]): void => {
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
        console.warn(`Factory ${factory.id} has an incomplete input. User may still be selecting it.`)
        return
      }

      // Stop if the factory input is somehow the same as the factory itself.
      if (input.factoryId === factory.id) {
        throw new Error(`Factory ${factory.id} is trying to add a dependency to itself!`)
      }

      const provider = factories.find(fac => fac.id === input.factoryId)
      if (!provider) {
        console.error(`Factory with ID ${input.factoryId} not found.`)

        // Remove it from the inputs if this is the case as it's invalid.
        factory.inputs = factory.inputs.filter(i => i !== input)
        return
      }

      addDependency(factory, provider, input)
    })
  })
}

// Create data helper classes to visualize the dependencies in the UI nicely.
export const calculateDependencyMetrics = (factory: Factory) => {
  Object.keys(factory.dependencies.requests).forEach(reqFac => {
    const requests = factory.dependencies.requests[reqFac]
    requests.forEach(request => {
      const part = request.part
      const metrics = factory.dependencies.metrics

      if (!metrics[part]) {
        metrics[part] = {
          part,
          request: 0,
          supply: factory.parts[part]?.amountSupplied ?? 0,
          isRequestSatisfied: false,
          difference: 0,
        }
      }

      metrics[part].request += request.amount
      metrics[part].difference = metrics[part].supply - metrics[part].request
      metrics[part].isRequestSatisfied = metrics[part].difference >= 0
    })
  })
}
