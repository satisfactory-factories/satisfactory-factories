import { Factory } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { Recipe } from '@/interfaces/Recipes'

export const createNewPart = (factory: Factory, part: string) => {
  if (!factory.parts[part]) {
    factory.parts[part] = {
      amountRequired: 0,
      amountRequiredExports: 0,
      amountRequiredProduction: 0,
      amountSupplied: 0,
      amountSuppliedViaInput: 0,
      amountSuppliedViaProduction: 0,
      amountRemaining: 0,
      satisfied: true,
      isRaw: false,
    }
  }
}

export const getRecipe = (partId: any, gameData: DataInterface): Recipe | undefined => {
  const recipe = gameData.recipes.find(r => r.id === partId)

  if (!recipe) {
    console.error(`Recipe with ID ${partId} not found.`)
    return
  }

  return recipe
}
