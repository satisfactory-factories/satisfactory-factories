// Calculate the supply of parts via raw inputs. It is assumed that the raw resources are always available.
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { getRecipe } from '@/utils/factory-management/common'

export const calculateRawSupply = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
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
