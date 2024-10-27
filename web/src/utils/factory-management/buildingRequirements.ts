// Calculates what buildings are required to produce the products.
import { BuildingRequirement, Factory } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'
import { getRecipe } from '@/utils/factory-management/common'

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
