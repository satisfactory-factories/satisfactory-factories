import { Factory, FactoryDependency } from '@/interfaces/planner/FactoryInterface'
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
      const [ingredient, ingredientAmount] = Object.entries(ingredientPart)[0]
      if (isNaN(ingredientAmount)) {
        console.warn(`Invalid ingredient amount for ingredient ${ingredient}. Skipping.`)
        return
      }

      const isRaw = gameData.items.rawResources[ingredient]

      // Get the first key of product
      const productKey = Object.keys(recipe.product)[0] // This is a large assumption there is only ever one product!

      let produces = recipe.product[productKey]

      if (isRaw) {
        produces = 1 // This is a large assumption!
      }

      const ingredientRequired = (product.amount / produces) * ingredientAmount

      console.log(`(${product.amount} / ${produces}) * ${ingredientAmount} = ${ingredientRequired}`)

      console.log('product', product)
      console.log('productKey', productKey)
      console.log('recipe', recipe)
      console.log('ingredient', ingredient)
      console.log('produces', produces)
      console.log('ingredientPart', ingredientPart)
      console.log('ingredientRequired', ingredientRequired)

      // Raw resource handling
      if (gameData.items.rawResources[ingredient]) {
        if (!factory.rawResources[ingredient]) {
          factory.rawResources[ingredient] = {
            name: gameData.items.rawResources[ingredient].name,
            amount: 0,
          }
        }
        factory.rawResources[ingredient] = {
          amount: factory.rawResources[ingredient].amount += ingredientRequired,
          satisfied: true, // Always mark raws as satisfied, it saves a ton of pain.
        }
      }

      // Set the amount that the individual products need.
      if (!product.requirements[ingredient]) {
        product.requirements[ingredient] = {
          amount: 0,
        }
      }

      product.requirements[ingredient].amount += ingredientRequired

      // Now add the requirements to the factory wide part requirements.
      if (!factory.partRequirements[ingredient]) {
        factory.partRequirements[ingredient] = {
          amountRequired: 0,
          amountSupplied: 0,
          amountSuppliedViaInput: 0,
          amountSuppliedViaInternal: 0,
          amountSuppliedViaRaw: 0,
        }
      }

      factory.partRequirements[ingredient].amountRequired += ingredientRequired
    })
  })
}

// Calculates what buildings are required to produce the products.
export const calculateBuildingRequirements = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
    if (product.recipe) {
      const recipe = gameData.recipes.find(r => r.id === product.recipe)
      if (recipe) {
        product.buildingRequirements = recipe.producedIn
          .filter(buildingName => buildingName !== 'bp_workbenchcomponent')
          .map(buildingName => {
            const buildingPower = gameData.buildings[buildingName]
            const buildingCount = (product.amount / recipe.perMin).toFixed(3)

            return {
              name: buildingName,
              amount: buildingCount,
              powerPerBuilding: buildingPower,
              totalPower: buildingPower * buildingCount,
            }
          })
      } else {
        product.buildingRequirements = []
      }
    } else {
      product.buildingRequirements = []
    }
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

export const calculateFactoryBuildingsAndPower = (factory: Factory) => {
  factory.totalPower = 0
  factory.buildingRequirements = {}

  // Loop through each product and sum the power requirements based off the metrics already there.
  factory.products.forEach(product => {
    product.buildingRequirements.forEach(building => {
      if (!factory.buildingRequirements[building.name]) {
        factory.buildingRequirements[building.name] = {
          name: building.name,
          amount: 0,
          powerPerBuilding: building.powerPerBuilding,
          totalPower: 0,
        }
      }

      factory.buildingRequirements[building.name].amount += parseFloat(building.amount)
      factory.buildingRequirements[building.name].totalPower += building.totalPower
    })

    // Sum the total power.
    factory.totalPower += product.buildingRequirements.reduce((acc, building) => acc + building.totalPower, 0)
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
    factory.dependencies = {
      requests: {},
      metrics: {},
    }
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

        if (!metrics[part]) {
          metrics[part] = {
            part,
            request: 0,
            supply: factory.surplus[part].amount ?? 0,
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

export const calculateHasProblem = (factory: Factory) => {
  factory.hasProblem = false

  let hasProblem = false
  // If any of the requirements are not satisfied, we have a problem.

  if (!factory.requirementsSatisfied) {
    hasProblem = true
  }

  // Loop through all of the dependency metrics of a factory and ensure all requests are satisfied.
  Object.keys(factory.dependencies.metrics).forEach(part => {
    if (!factory.dependencies.metrics[part].isRequestSatisfied) {
      hasProblem = true
    }
  })

  factory.hasProblem = hasProblem
}

// Determine if we're only using raw resources in this factory.
export const calculateUsingRawResourcesOnly = (factory: Factory) => {
  factory.usingRawResourcesOnly = false

  // 1. Check if there's a rawResources object with content (if not skip further checks).
  // 2. Check if we are only using raw resources in the partsRequired array. If they're not the same, we're using something else other than raw resource parts.
  // Get the keys of both the rawResources and partRequirements objects.

  if (Object.keys(factory.rawResources).length === 0) {
    return
  }

  const rawResourcesKeys = Object.keys(factory.rawResources)
  const partRequirementsKeys = Object.keys(factory.partRequirements)

  // If the arrays are the same, we're only using raw resources.
  if (rawResourcesKeys.length === partRequirementsKeys.length && rawResourcesKeys.every((value, index) => value === partRequirementsKeys[index])) {
    factory.usingRawResourcesOnly = true
  }
}
