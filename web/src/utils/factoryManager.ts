import { Factory, FactoryDependency } from '@/interfaces/planner/Factory'
import { DataInterface } from '@/interfaces/DataInterface'

export const calculateProductRequirements = (factory: Factory, gameData: DataInterface) => {
  factory.rawResources = {}
  factory.partRequirements = {}

  // First loop through each product and calculate requirements.
  factory.products.forEach(product => {
    product.requirements = {} // Prevents orphaning

    const recipe = gameData.recipes.find(r => r.id === product.recipe)
    if (!recipe) {
      console.error(`Recipe with ID ${product.recipe} not found.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredientPart => {
      const [part, partAmount] = Object.entries(ingredientPart)[0]
      if (isNaN(partAmount)) {
        console.warn(`Invalid ingredient amount for ingredient ${part}. Skipping.`)
        return
      }

      // Raw resource handling
      if (gameData.items.rawResources[part]) {
        if (!factory.rawResources[part]) {
          factory.rawResources[part] = {
            name: gameData.items.rawResources[part].name,
            amount: 0,
          }
        }
        factory.rawResources[part] = {
          amount: partAmount * product.amount,
          satisfied: true, // Always mark raws as satisfied, it saves a ton of pain.
        }
      }

      if (!product.requirements[part]) {
        product.requirements[part] = {
          amount: partAmount * product.amount,
        }
      }

      // Now add the requirements to the factory wide part requirements.
      if (!factory.partRequirements[part]) {
        factory.partRequirements[part] = {
          amountRequired: 0,
          amountSupplied: 0,
          amountSuppliedViaInput: 0,
          amountSuppliedViaInternal: 0,
          amountSuppliedViaRaw: 0,
        }
      }

      factory.partRequirements[part].amountRequired += partAmount * product.amount
    })
  })
}

// Calculate the supply of parts via raw inputs. It is assumed that the raw resources are always available.
// Prepare to lose your brain!
export const calculateFactoryRawSupply = (factory: Factory, gameData: DataInterface) => {
  Object.keys(factory.products).forEach(productIndex => {
    const product = factory.products[productIndex]
    // Due to the weird way the raw resources are handled, we have to loop by product, pull out the recipeID and check if the raw resource have the ingredient within the rawResources key.

    // Get the recipe
    const recipe = gameData.recipes.find(r => r.id === product.recipe)
    if (!recipe) {
      console.error(`Recipe with ID ${product.recipe} not found.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredientPart => {
      const [part] = Object.entries(ingredientPart)[0]

      // If the part is a raw resource, mark it as supplied.
      if (factory.rawResources[part]) {
        // This looks like a hack, but it's correct, the raw recipes are a PITA.
        factory.partRequirements[part].amountSuppliedViaRaw = factory.rawResources[part].amount
      }
    })
  })
}

// Loop through each product, and check if the parts produced by a recipe match a product requirement. If so, we mark that as an internal product and recalculate the remainder.
export const calculateFactoryInternalSupply = (factory: Factory, gameData: DataInterface) => {
  factory.internalProducts = {}

  factory.products.forEach(product => {
    const recipe = gameData.recipes.find(r => r.id === product.recipe)
    if (!recipe) {
      console.error(`Recipe with ID ${product.recipe} not found.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(productIngredient => {
      const [ingredient] = Object.entries(productIngredient)[0]

      // If the part is a requirement, mark it as an internal product.
      const foundProduct = factory.products.find(p => p.id === ingredient)

      if (foundProduct) {
        factory.internalProducts[ingredient] = {
          id: foundProduct.id,
          amount: foundProduct.amount,
        }

        // Update the supply of the part.
        factory.partRequirements[foundProduct.id].amountSuppliedViaInternal = foundProduct.amount
      }
    })
  })
}

// Calculate the supply of parts via inputs. It is assumed that the input factories are supplying this factory at 100% efficiency, we then report shortages at the supplying factory so production can be increased there.
export const calculateFactoryInputSupply = (factories: Factory[], factory: Factory) => {
  factory.inputs.forEach(input => {
    const requestedFactory = factories.find(fac => fac.id === input.factoryId)
    if (!requestedFactory) {
      console.error(`Factory with ID ${input.factoryId} not found.`)
      return
    }

    // We have to assume here that a product is being supplied at 100% efficiency.
    const requestedProduct = requestedFactory.products.find(product => product.id === input.outputPart)
    if (!requestedProduct) {
      console.error(`Product with ID ${input.outputPart} not found in factory ${input.factoryId}.`)
      return
    }

    // Update the supply of the part.
    factory.partRequirements[requestedProduct.id].amountSuppliedViaInput += input.amount
  })
}

// Calculate the remaining amount of parts required after all inputs and internal products are accounted for.
export const calculateFactorySatisfaction = (factory: Factory) => {
  // If factory has no products there is nothing for us to do, so mark as satisfied.
  if (factory.products.length === 0) {
    factory.requirementsSatisfied = true
    return
  }

  Object.keys(factory.products).forEach(productIndex => {
    const product = factory.products[productIndex]
    Object.keys(product.requirements).forEach(partIndex => {
      const requirement = factory.partRequirements[partIndex]

      // Calculate the remaining amount of parts required after all inputs and internal products are accounted for.
      requirement.amountSupplied =
        requirement.amountSuppliedViaInternal +
        requirement.amountSuppliedViaInput +
        requirement.amountSuppliedViaRaw

      requirement.amountRemaining = requirement.amountRequired - requirement.amountSupplied

      // Check if the input amount is enough to satisfy the requirement.
      requirement.satisfied = requirement.amountRemaining <= 0
    })

    // Now check if all requirements are satisfied and flag so if it is.
    factory.requirementsSatisfied = Object.keys(factory.partRequirements).every(part => factory.partRequirements[part].satisfied)
  })
}

export const calculateSurplus = (factory: Factory) => {
  factory.surplus = {} // Avoids orphaning

  // Loop through each product.
  // We need to check if the product has requirements.
  // If it has requirements, check the amountRemaining, if it less than 0, we have a surplus.
  // If it does not have requirements, add the product directly as a surplus because it is not an intermediary product.
  factory.products.forEach(product => {
    // If there are no part requirements for this product, it is a surplus.
    if (!factory.partRequirements[product.id]) {
      factory.surplus[product.id] = {
        amount: product.amount,
        surplusHandling: 'export',
      }
    } else {
      const requirement = factory.partRequirements[product.id]
      // If the amount remaining is less than 0, we have a surplus.
      if (requirement.amountRemaining < 0) {
        factory.surplus[product.id] = {
          amount: Math.abs(requirement.amountRemaining),
          surplusHandling: 'export',
        }
      }
    }
  })
}

// Loop through all factories, checking their inputs and building a dependency tree.
export const calculateDependencies = (factories: Factory[]): FactoryDependency => {
  // First, remove the current dependencies for each factory to ensure we're not orphaning.
  factories.forEach(factory => {
    factory.dependencies = {}
  })

  // Second, rebuild the dependencies.
  factories.forEach(factory => {
    factory.inputs.forEach(input => {
      const requestedFactory = factories.find(fac => fac.id === input.factoryId)
      if (!requestedFactory) {
        console.error(`Factory with ID ${input.factoryId} not found.`)

        // Remove it from the inputs if this is the case as it's invalid.
        factory.inputs = factory.inputs.filter(i => i !== input)

        return
      }

      if (!requestedFactory.dependencies[factory.id]) {
        requestedFactory.dependencies[factory.id] = {
          requestedBy: [],
          metrics: {},
        }
      }

      requestedFactory.dependencies[factory.id].requestedBy.push({
        part: input.outputPart,
        amount: input.amount,
      })
    })
  })
}

// Create data helper classes to visualize the dependencies in the UI nicely.
export const calculateDependencyMetrics = (factories: Factory[]) => {
  factories.forEach(factory => {
    Object.keys(factory.dependencies).forEach(dependencyId => {
      const dependency = factory.dependencies[dependencyId]

      dependency.requestedBy.forEach(request => {
        const part = request.part

        if (!dependency.metrics[part]) {
          dependency.metrics[part] = {
            part,
            request: 0,
            supply: 0,
            isRequestSatisfied: false,
          }
        }

        dependency.metrics[part].request += request.amount

        // Supply is calculated from the surplus of the factory. If the surplus doesn't exist, there is a shortage.
        const requestedFactory = factories.find(fac => fac.id === parseInt(dependencyId))
        if (requestedFactory.surplus[part]) {
          dependency.metrics[part].supply += requestedFactory.surplus[part] // Additive
          dependency.metrics[part].isRequestSatisfied = dependency.metrics[part].supply >= dependency.metrics[part].request
        }
      })
    })
  })
}

export const calculateHasProblem = (factory: Factory) => {
  factory.hasProblem = false

  let hasProblem = false
  // If any of the requirements are not satisfied, we have a problem.

  if (!factory.requirementsSatisfied) {
    hasProblem = true
  }

  factory.hasProblem = hasProblem
}
