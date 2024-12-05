import { Factory, FactoryPowerProducer } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { getPowerRecipeById } from '@/utils/factory-management/common'

export const calculatePowerGeneration = (factory: Factory, gameData: DataInterface) => {
  factory.powerProducers.forEach(producer => {
    producer.ingredients = calculatePowerIngredients(producer, gameData)
  })
}

export const calculatePowerIngredients = (
  producer: FactoryPowerProducer,
  gameData: DataInterface,
): { part: string, amount: number}[] => {
  if (!gameData || !producer) {
    console.error('calculatePowerIngredients: Missing gameData or producer!')
    return []
  }

  const recipe = getPowerRecipeById(producer.recipe, gameData)
  if (!recipe) {
    console.error('calculatePowerIngredients: Could not find recipe!', producer)
    return []
  }

  // Calculate the amount of ingredients needed to produce the power
  const ingredients: { part: string, amount: number }[] = []
  recipe.ingredients.forEach(ingredient => {
    ingredients.push({
      part: ingredient.part,
      amount: producer.powerAmount / ingredient.perMin,
    })
  })

  return ingredients
}
