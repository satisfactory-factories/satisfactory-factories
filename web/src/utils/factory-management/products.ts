import { BuildingRequirement, ByProductItem, Factory, FactoryItem } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { getRecipe } from '@/utils/factory-management/common'

export const addProductToFactory = (
  factory: Factory,
  options: {
    id?: string,
    amount?: number,
    recipe?: string,
    requirements?: { [key: string]: { amount: number } },
    displayOrder?: number,
  }
) => {
  factory.products.push({
    id: options.id ?? '',
    amount: options.amount ?? 1,
    recipe: options.recipe ?? '',
    displayOrder: options.displayOrder ?? factory.products.length,
    requirements: options.requirements ?? {},
    buildingRequirements: {} as BuildingRequirement,
    byProducts: [],
  })
}

// Loops through all products and figures out what they produce and what they require, then adds it to the factory.parts object.
export const calculateProducts = (factory: Factory, gameData: DataInterface) => {
  factory.products.forEach(product => {
    product.requirements = {} // Prevents orphaning

    const recipe = getRecipe(product.recipe, gameData)
    if (!recipe) {
      console.warn(`calculateProductRequirements: Recipe with ID ${product.recipe} not found. It could be the user has not yet selected one.`)
      return
    }

    if (product.amount < 0) {
      // If the product amount is negative, this causes issues with calculations, so force it to 0.
      product.amount = 0
      return // Nothing else to do
    }

    // Calculate the ingredients needed to make this product.
    recipe.ingredients.forEach(ingredient => {
      if (isNaN(ingredient.amount)) {
        console.error(`Invalid ingredient amount for ingredient "${ingredient.part}". Skipping.`)
        return
      }

      // === Now we need to calculate the parts required per min to make the product ===
      const productIngredientRatio = product.amount / recipe.products[0].perMin // This formula should have no rounding - the decimal points are important here for the floating point calculations
      let ingredientRequired = ingredient.perMin * productIngredientRatio
      ingredientRequired = Math.round(ingredientRequired * 1000) / 1000

      // Handle the ingredients
      // Set the amount that the individual products need for display purposes.
      if (!product.requirements[ingredient.part]) {
        product.requirements[ingredient.part] = {
          amount: 0,
        }
      }

      product.requirements[ingredient.part].amount += ingredientRequired
    })
  })

  // Now calculate byproducts
  calculateByProducts(factory, gameData)
}

export const calculateByProducts = (factory: Factory, gameData: DataInterface): void => {
  factory.byProducts = [] // Prevents orphaning / duplication
  factory.products.forEach(product => {
    product.byProducts = [] // Prevents orphaning / duplication

    const recipe = getRecipe(product.recipe, gameData)

    if (!recipe) {
      console.warn('getByProduct: Could not get recipe, user may not have picked one yet.')
      return
    }

    const byProducts = recipe.products.filter(p => p.isByProduct)

    if (byProducts.length === 0) {
      return
    }

    byProducts.forEach(byProduct => {
      // We need to get ratio of product to byProduct by looking at the recipe's original product amount and the byProduct amount.
      const byProductRatio = byProduct.amount / recipe.products[0].amount

      // Now we compare the product.amount (the amount being produced) and times by the ratio to get the byProduct amount.
      const byProductAmount = product.amount * byProductRatio

      if (!product.byProducts) {
        product.byProducts = []
      }

      // Add to the byProducts of the product
      product.byProducts.push({
        id: byProduct.part,
        byProductOf: product.id,
        amount: byProductAmount,
      })

      // Now we need to add the byProduct to the factory's byProducts array for use by the Exports array purposes
      const byProductExists = factory.byProducts.find(p => p.id === byProduct.part)

      if (!byProductExists) {
        factory.byProducts.push({
          id: byProduct.part,
          amount: byProductAmount,
          byProductOf: product.id,
        })
      } else {
        byProductExists.amount += byProductAmount
      }
    })
  })
}

export const shouldShowFix = (product: FactoryItem, factory: Factory): string | null => {
  // Calculate whether the product should be trimmed or not by checking:
  // 1. Part requirements of the item are more than internal demand
  // 2. Exported difference is more than 0

  if (!product?.id) {
    return null
  }

  const part = factory.parts[product.id]

  if (!part) {
    console.error(`Part not found for product ID ${product.id}!`)
    return null
  }

  // It's likely a new product or empty one, no need to show trim
  if (product.amount === 0 || product.amount === 1) {
    return null
  }

  // It's in demand but not enough is being produced
  if (part.amountRemaining < 0) {
    return 'deficit'
  }

  // If the part does not have a demand, we should show nothing as it could be an end product
  if (part.amountRequired === 0) {
    return null
  }

  if (part.amountRemaining > 0) {
    return 'surplus'
  }

  // Must then mean it's exactly right at remaining 0.
  return null
}

export const shouldShowInternal = (product: FactoryItem, factory: Factory) => {
  if (!factory.parts[product.id]) {
    return false
  }
  return factory.parts[product.id].amountRequiredProduction > 0 || factory.parts[product.id].amountRequiredPower > 0
}

export const shouldShowNotInDemand = (product: FactoryItem, factory: Factory) => {
  // Calculate whether the product is in demand at all
  if (!product.id) {
    return false
  }

  const partRequired = factory.parts[product.id]?.amountRequired

  return partRequired <= 0
}

export const fixProduct = (product: FactoryItem | ByProductItem, factory: Factory): void => {
  // If the product is not found, throw
  if (!product.id) {
    const error = 'products: fixPart: Product ID is missing!'
    console.error(error)
    throw new Error(error)
  }
  // If the part is not found, throw
  if (!factory.parts[product.id]) {
    const error = `products: fixPart: Part data for "${product.id}" is missing!`
    console.error(error)
    throw new Error(error)
  }

  const partData = factory.parts[product.id]

  // If the factory is producing byproducts, we need to handle that properly. Using the part data we should be able to achieve this regardless of the product type.

  const produced = partData.amountSuppliedViaProduction
  const required = partData.amountRequired
  const diff = required - produced

  // Whatever calls this MUST then trigger a calculation.
  product.amount = diff + product.amount
}
