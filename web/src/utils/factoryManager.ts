import { BuildingRequirement, Factory } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { Recipe } from '@/interfaces/Recipe'

const createNewPart = (factory: Factory, part: string) => {
  if (!factory.parts[part]) {
    factory.parts[part] = {
      amountRequired: 0,
      amountSupplied: 0,
      amountSuppliedViaInput: 0,
      amountSuppliedViaProduction: 0,
      amountRemaining: 0,
      satisfied: true,
      isRaw: false,
    }
  }
}

// Runs calculations of the metrics within the part, saves having to run it in multiple places.
const calculatePartMetrics = (factory: Factory, part: string) => {
  const partData = factory.parts[part]

  // If supplied from raw, we always assure that it is fully supplied and satisfied
  if (partData.isRaw) {
    partData.amountSupplied = partData.amountRequired
  } else {
    partData.amountSupplied = partData.amountSuppliedViaInput + partData.amountSuppliedViaProduction
  }

  partData.amountRemaining = partData.amountRequired - partData.amountSupplied
  partData.satisfied = partData.amountRemaining <= 0
}

// This simply loops through all the inputs and adds them to the parts object.
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

// Loops through all products and figures out what they produce and what they require, then adds it to the factory.parts object.
export const calculateProducts = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
    product.requirements = {} // Prevents orphaning

    if (product.id === 'CompactedCoal') {
      console.log('CompactedCoal')
    }

    const recipe = getRecipe(product.recipe, gameData)
    if (!recipe) {
      console.warn(`calculateProductRequirements: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
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
      return // Nothing else to do
    }

    // Add the output of the product to the parts array
    createNewPart(factory, product.id)
    factory.parts[product.id].amountSuppliedViaProduction = product.amount
    calculatePartMetrics(factory, product.id)

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredient => {
      if (isNaN(ingredient.amount)) {
        console.warn(`Invalid ingredient amount for ingredient "${ingredient.part}". Skipping.`)
        return
      }

      // === Now we need to also factor in the product's ingredients, and add it to the parts array.
      const ingredientRequired = ingredient.amount * product.amount

      // In every case, always add the ingredient to the parts list
      createNewPart(factory, ingredient.part)
      factory.parts[ingredient.part].amountRequired += ingredientRequired

      // Raw resource handling
      if (gameData.items.rawResources[ingredient.part]) {
        if (!factory.rawResources[ingredient.part]) {
          factory.rawResources[ingredient.part] = {
            id: ingredient.part,
            name: gameData.items.rawResources[ingredient.part].name,
            amount: 0,
          }
        }

        factory.rawResources[ingredient.part].amount += ingredientRequired

        // Mark the part as raw which will eventually be marked as fully satisfied.
        factory.parts[ingredient.part].isRaw = true
        calculatePartMetrics(factory, ingredient.part)
      }

      // Set the amount that the individual products need for display purposes.
      if (!product.requirements[ingredient.part]) {
        product.requirements[ingredient.part] = {
          amount: 0,
        }
      }

      product.requirements[ingredient.part].amount += ingredientRequired
    })
  })
}

export const calculateByProducts = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
    product.byProducts = [] // Prevents orphaning / duplication

    const recipe = getRecipe(product.recipe, gameData)

    if (!recipe) {
      console.warn('getByProduct: Could not get recipe, user may not have picked one yet.')
      return null
    }

    const byProducts = recipe.products.filter(p => p.isByProduct)

    if (byProducts.length === 0) {
      return null
    }

    byProducts.forEach(byProduct => {
      // We need to get ratio of product to byProduct by looking at the recipe's original product amount and the byProduct amount.
      const byProductRatio = byProduct.amount / recipe.products[0].amount

      // Now we compare the product.amount (the amount being produced) and times by the ratio to get the byProduct amount.
      const byProductAmount = product.amount * byProductRatio

      // Now we need to add the byProduct to the product's byProducts array for display purposes
      product.byProducts.push({
        id: byProduct.part,
        byProductOf: product.id,
        amount: byProductAmount,
      })

      // Now also add the part that the Byproduct creates to the parts list
      createNewPart(factory, byProduct.part)
      factory.parts[byProduct.part].amountSuppliedViaProduction += byProductAmount
      calculatePartMetrics(factory, byProduct.part)
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
        product.buildingRequirements = {} as BuildingRequirement
        return
      }

      const buildingData = recipe.building
      const buildingCount = (product.amount / productInRecipe.perMin).toFixed(3)

      product.buildingRequirements = {
        name: buildingData.name,
        amount: buildingCount,
        powerPerBuilding: buildingData.power,
        totalPower: (parseInt(buildingData.power) * parseInt(buildingCount)).toFixed(2),
      }
    } else {
      product.buildingRequirements = {} as BuildingRequirement
    }
  })
}

// Calculate the supply of parts via raw inputs. It is assumed that the raw resources are always available.
export const calculateRawSupply = (factory: Factory, gameData: DataInterface) => {
  Object.keys(factory.products).forEach(productId => {
    const product = factory.products.find(p => p.id === productId)

    if (!product) {
      console.warn(`calculateFactoryRawSupply: Product with ID ${productId} not found. It could be the user has not yet selected one.`)
      return
    }
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
        factory.parts[ingredient.part].amountSuppliedViaInput = factory.rawResources[ingredient.part].amount
      }
    })
  })
}

// Loop through each product, and check if the parts produced by a recipe match a product requirement. If so, we mark that as an internal product and recalculate the remainder.
export const calculateInternalProducts = (factory: Factory, gameData: DataInterface) => {
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
      }
    })
  })
}

// Calculate the remaining amount of parts required after all inputs and internal products are accounted for.
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

export const calculateBuildingsAndPower = (factory: Factory) => {
  factory.totalPower = '0'
  factory.buildingRequirements = {} as {[key: string]: BuildingRequirement }

  // Loop through each product and sum the power requirements based off the metrics already there.
  factory.products.forEach(product => {
    const building = product.buildingRequirements
    if (!factory.buildingRequirements[building.name]) {
      factory.buildingRequirements[building.name] = {
        name: building.name,
        amount: '0',
        powerPerBuilding: building.powerPerBuilding,
        totalPower: '0',
      }
    }

    const facBuilding = factory.buildingRequirements[building.name]

    facBuilding.amount = String(parseFloat(facBuilding.amount) + parseFloat(building.amount))
    facBuilding.totalPower = String(parseFloat(facBuilding.totalPower) + parseFloat(building.totalPower))

    // Sum the total power.
    factory.totalPower = String(parseFloat(factory.totalPower) + parseFloat(building.totalPower))
  })
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

// Loop through all factories, checking their inputs and building a dependency tree.
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

export const configureExportCalculator = (factories: Factory[]) => {
  factories.forEach(factory => {
    // For each surplus product we need to make sure there is an export calculator setting associated with it
    Object.keys(factory.surplus).forEach(part => {
      // If there's not already a record for this surplus product, create one now.
      if (!factory.exportCalculator[part]) {
        factory.exportCalculator[part] = {
          selected: null,
          factorySettings: {},
        }
      }

      // For readability
      const exportCalculatorSettings = factory.exportCalculator[part]

      // Now we need to check if the selected export calculator setting is still valid.
      if (exportCalculatorSettings.selected !== null && !factory.dependencies.requests[exportCalculatorSettings.selected]) {
        exportCalculatorSettings.selected = null
      }

      const requestKeys = Object.keys(factory.dependencies.requests)

      // If the selection has not yet been made, make it the first option now.
      if (exportCalculatorSettings.selected === null && requestKeys.length > 0) {
        exportCalculatorSettings.selected = requestKeys[0] ?? null
      }

      // We also need to pre-fill the factory settings for the requests
      requestKeys.forEach(request => {
        if (!exportCalculatorSettings.factorySettings[request]) {
          exportCalculatorSettings.factorySettings[request] = {
            trainTime: 123,
          }
        }
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
export const calculateUsingRawResourcesOnly = (factory: Factory, gameData: DataInterface) => {
  factory.usingRawResourcesOnly = true

  // Check each product, and check if all their ingredients are raw, if so we're only using raw resources.
  factory.products.forEach(product => {
    const recipe = getRecipe(product.recipe, gameData)
    if (!recipe) {
      console.warn(`calculateUsingRawResourcesOnly: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
      return
    }

    // If any ingredient is not raw, mark the whole factory as not using only raw ingredients
    recipe.ingredients.forEach(ingredient => {
      if (!gameData.items.rawResources[ingredient.part]) {
        factory.usingRawResourcesOnly = false
      }
    })
  })
}

const getRecipe = (partId: any, gameData: DataInterface): Recipe | undefined => {
  const recipe = gameData.recipes.find(r => r.id === partId)

  if (!recipe) {
    console.error(`Recipe with ID ${partId} not found.`)
    return
  }

  return recipe
}
