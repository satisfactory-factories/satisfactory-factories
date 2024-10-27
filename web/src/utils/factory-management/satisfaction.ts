// Calculate the remaining amount of parts required after all inputs and internal products are accounted for.
import { BuildingRequirement, Factory } from '@/interfaces/planner/FactoryInterface'
import { calculatePartMetrics } from '@/utils/factory-management/common'

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
