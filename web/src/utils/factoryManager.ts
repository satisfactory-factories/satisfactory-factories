import { Factory, FactoryDependency } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { Recipe } from '@/interfaces/Recipe'

export const calculateProductRequirements = (factory: Factory, gameData: DataInterface) => {
  factory.rawResources = {}
  factory.partRequirements = {}

  // First loop through each product and calculate requirements.
  factory.products.forEach(product => {
    product.requirements = {} // Prevents orphaning

    const recipe = getRecipe(product.recipe, gameData)

    if (!recipe) {
      console.warn(`calculateProductRequirements: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredient => {
      if (isNaN(ingredient.amount)) {
        console.warn(`Invalid ingredient amount for ingredient "${ingredient}". Skipping.`)
        return
      }

      if (product.amount === 0 || !product.amount) {
        // If the product amount is 0, we don't need to calculate anything, because the user might be entering a new number.
        // I tried forcing this to be 1, but it causes a lot of frustration for the user, so it's better to just simply do nothing.
        return
      }

      if (product.amount < 0) {
        // If the product amount is negative, this causes issues with calculations, so force it to 0.
        product.amount = 0
      }

      const ingredientRequired = ingredient.amount * product.amount

      // Raw resource handling
      if (gameData.items.rawResources[ingredient.part]) {
        if (!factory.rawResources[ingredient.part]) {
          factory.rawResources[ingredient.part] = {
            name: gameData.items.rawResources[ingredient.part].name,
            amount: 0,
          }
        }
        factory.rawResources[ingredient.part] = {
          amount: factory.rawResources[ingredient.part].amount += ingredientRequired,
          satisfied: true, // Always mark raws as satisfied, it saves a ton of pain.
        }
      }

      // Set the amount that the individual products need.
      if (!product.requirements[ingredient.part]) {
        product.requirements[ingredient.part] = {
          amount: 0,
        }
      }

      product.requirements[ingredient.part].amount += ingredientRequired

      // Now add the requirements to the factory wide part requirements.
      if (!factory.partRequirements[ingredient.part]) {
        factory.partRequirements[ingredient.part] = {
          amountRequired: 0,
          amountSupplied: 0,
          amountSuppliedViaInput: 0,
          amountSuppliedViaInternal: 0,
          amountSuppliedViaRaw: 0,
        }
      }

      factory.partRequirements[ingredient.part].amountRequired += ingredientRequired
    })
  })
}

// Calculates what buildings are required to produce the products.
export const calculateBuildingRequirements = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
    if (product.recipe) {
      const recipe = getRecipe(product.recipe, gameData)

      if (!recipe) {
        console.warn(`calculateBuildingRequirements: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
        return
      }

      const productInRecipe = recipe.products.filter(p => p.part === product.id)[0]

      if (!productInRecipe) {
        product.buildingRequirements = {}
        return
      }

      const buildingData = recipe.building
      const buildingCount = (product.amount / productInRecipe.perMin).toFixed(3)

      product.buildingRequirements = {
        name: buildingData.name,
        amount: buildingCount,
        powerPerBuilding: buildingData.power,
        totalPower: buildingData.power * buildingCount,
      }
    } else {
      product.buildingRequirements = {}
    }
  })
}

// Calculate the supply of parts via raw inputs. It is assumed that the raw resources are always available.
export const calculateFactoryRawSupply = (factory: Factory, gameData: DataInterface) => {
  Object.keys(factory.products).forEach(productIndex => {
    const product = factory.products[productIndex]
    // Due to the weird way the raw resources are handled, we have to loop by product, pull out the recipeID and check if the raw resource have the ingredient within the rawResources key.

    // Get the recipe
    const recipe = getRecipe(product.recipe, gameData)

    if (!recipe) {
      console.warn(`calculateFactoryRawSupply: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredient => {
      // If the part is a raw resource, mark it as supplied.
      if (factory.rawResources[ingredient.part]) {
        // This looks like a hack, but it's correct, the raw recipes are a PITA.
        factory.partRequirements[ingredient.part].amountSuppliedViaRaw = factory.rawResources[ingredient.part].amount
      }
    })
  })
}

// Loop through each product, and check if the parts produced by a recipe match a product requirement. If so, we mark that as an internal product and recalculate the remainder.
export const calculateFactoryInternalSupply = (factory: Factory, gameData: DataInterface) => {
  factory.internalProducts = {}

  factory.products.forEach(product => {
    const recipe = getRecipe(product.recipe, gameData)
    if (!recipe) {
      console.warn(`calculateFactoryInternalSupply: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
      return
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredient => {
      // If the part is a requirement, mark it as an internal product.
      const foundProduct = factory.products.find(p => p.id === ingredient.part)

      if (foundProduct) {
        factory.internalProducts[ingredient.part] = {
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
    const building = product.buildingRequirements
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

    // Sum the total power.
    factory.totalPower += building.totalPower
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
      // Handle the case where the user is mid-way selecting an input.
      if (input.factoryId === 0) {
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

export const configureExportCalculator = (factories: Factory[]) => {
  factories.forEach(factory => {
    console.log(factory.dependencies.requests)
    const requestKeys = Object.keys(factory.dependencies.requests)

    // Now that all the dependencies are created, if the selection has not yet been made, make it the first selection now.
    if (factory.exportCalculator.selected === null && requestKeys.length > 0) {
      factory.exportCalculator.selected = requestKeys[0] ?? null
    }

    // If there are no settings, make the key now.
    if (!factory.exportCalculator.settings) {
      factory.exportCalculator.settings = {}
    }

    // Now check each of the export calculator settings to ensure that the factory is still a valid dependency, if not it needs removing.
    // Obviously if this was just created it does nothing.
    Object.keys(factory.exportCalculator.settings).forEach(factoryId => {
    // Check if there is still a dependency between the two factories.
      if (!factory.dependencies.requests[factoryId]) {
        delete factory.exportCalculator.settings[factoryId]
      }
    })

    // Now initialize the export calculator settings for each factory, if they don't exist already.
    factories.forEach(fac => {
      if (!fac.exportCalculator.settings[factory.id]) {
        fac.exportCalculator.settings[factory.id] = {
          trainTime: 123,
        }
      }
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

export const calculateHasProblem = (factories: Factory[]) => {
  // Loop all factories to detect if they have problems
  factories.forEach(factory => {
    factory.hasProblem = false

    let hasProblem = false
    // If any of the requirements are not satisfied, we have a problem.

    if (!factory.requirementsSatisfied) {
      hasProblem = true
    }

    // Loop through all of the dependency metrics of a factory and ensure all requests are satisfied.
    Object.keys(factory.dependencies.metrics).forEach(part => {
    // We need to have !hasProblem because we don't want to overwrite the hasProblem flag if it's already set.
      if (!hasProblem && !factory.dependencies.metrics[part].isRequestSatisfied) {
        hasProblem = true
      }
    })

    factory.hasProblem = hasProblem
  })
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

const getRecipe = (partId: any, gameData: DataInterface): Recipe => {
  const recipe = gameData.recipes.find(r => r.id === partId)

  if (!recipe) {
    console.error(`Recipe with ID ${partId} not found.`)
    return
  }

  return recipe
}
