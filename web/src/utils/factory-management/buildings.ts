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
      const buildingCount = product.amount / productInRecipe.perMin

      product.buildingRequirements = {
        name: buildingData.name,
        amount: buildingCount.toFixed(3),
        powerPerBuilding: Number(buildingData.power),
        totalPower: parseFloat((Number(buildingData.power) * buildingCount).toFixed(2)),
      }
    } else {
      product.buildingRequirements = {} as BuildingRequirement
    }
  })
}

export const calculateBuildingsAndPower = (factory: Factory) => {
  factory.totalPower = 0
  factory.buildingRequirements = {} as { [key: string]: BuildingRequirement }

  // Loop through each product and sum the power requirements based off the metrics already there.
  factory.products.forEach(product => {
    const building = product.buildingRequirements
    if (!factory.buildingRequirements[building.name]) {
      factory.buildingRequirements[building.name] = {
        name: building.name,
        amount: '0',
        powerPerBuilding: building.powerPerBuilding,
        totalPower: 0,
      }
    }

    const facBuilding = factory.buildingRequirements[building.name]

    facBuilding.amount = String(parseFloat(facBuilding.amount) + parseFloat(building.amount))
    facBuilding.totalPower = parseFloat((parseFloat(facBuilding.totalPower) + building.totalPower).toFixed(2))
    // Sum the total power.
    factory.totalPower = parseFloat((factory.totalPower + building.totalPower).toFixed(2))
  })
}
