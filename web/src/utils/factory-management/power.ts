import { Factory, FactoryPowerProducer } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { createNewPart, getPowerRecipeById } from '@/utils/factory-management/common'
import { PowerRecipe } from '@/interfaces/Recipes'
import { formatNumber } from '@/utils/numberFormatter'

// Depending on which value is updated, we need to recalculate the power generation.
export const calculatePowerGeneration = (
  factory: Factory,
  gameData: DataInterface
) => {
  factory.powerProducers.forEach(producer => {
    const recipe = getPowerRecipeById(producer.recipe, gameData)

    if (!recipe) {
      console.error(`Could not find recipe with id: ${producer.recipe}`)
      return
    }

    if (!producer.ingredients[0]) {
      console.error(`No ingredients found for producer: ${producer.recipe}`)
      alert('No ingredients found for producer! Please delete it and add it again!')
      return
    }

    if (producer.updated === 'power') {
      producer.powerProduced = producer.powerAmount // Simply replace it

      // Now we need to calculate the amount of items produced per minute
      producer.ingredientAmount = producer.powerProduced / (recipe.ingredients[0].mwPerItem ?? 0)
      producer.ingredients[0].perMin = producer.ingredientAmount
    } else if (producer.updated === 'ingredient') {
      producer.ingredients[0].perMin = producer.ingredientAmount // Replace the ingredient directly

      // Now we've handled the updated values, we can calculate the power generation again
      producer.powerProduced = calculatePowerAmount(producer, recipe)
      producer.powerAmount = Number(formatNumber(producer.powerProduced))
    } else if (producer.updated === 'building') {
      producer.buildingCount = producer.buildingAmount // Replace the building directly

      // Now we need to set the ingredients in a ratio equivalent of the amount of buildings
      producer.ingredients[0].perMin = producer.buildingCount * recipe.ingredients[0].perMin
      producer.ingredientAmount = producer.ingredients[0].perMin

      // Now we need to increase the power so the supplemental fuel is calculated correctly
      producer.powerProduced = calculatePowerAmount(producer, recipe)
      producer.powerAmount = producer.powerProduced
    }

    // For supplemental fuels, we need to know the power produced in order to calculate them
    if (producer.ingredients[1]) {
      producer.ingredients[1].perMin = producer.powerProduced * (recipe.ingredients[1].supplementalRatio ?? 0)
    }

    if (producer.updated !== 'building') {
      // Now calculate the amount of buildings the user needs to build
      producer.buildingCount = producer.powerProduced / recipe.building.power
      producer.buildingAmount = producer.buildingCount
    }

    // Now add the ingredients to the parts array
    producer.ingredients.forEach(ingredient => {
      createNewPart(factory, ingredient.part)

      factory.parts[ingredient.part].amountRequiredPower += ingredient.perMin
    })
  })
}

export const calculatePowerAmount = (
  producer: FactoryPowerProducer,
  recipe: PowerRecipe,
): number => {
  // Simply take the mwPerItem and multiply by the amount of items produced per minute
  const mwPerItem = recipe.ingredients[0].mwPerItem ?? 0
  const amount = producer.ingredientAmount
  return mwPerItem * amount
}
