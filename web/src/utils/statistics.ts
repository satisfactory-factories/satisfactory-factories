import { Factory } from '@/interfaces/planner/FactoryInterface'
import {
  getPartDisplayName,
  hasMetricsForPart,
} from '@/utils/helpers'
// This function calculates the total number of buildings for each type
export const calculateTotalBuildingsByType = (factories: Factory[]) => {
  const buildings: Record<
    string,
    {
      name: string;
      totalAmount: number;
      powerPerBuilding: number;
      totalPower: number;
    }
  > = {} // Explicitly define the type

  factories.forEach(factory => {
    Object.entries(factory.buildingRequirements).forEach(
      ([key, requirement]) => {
        if (!buildings[key]) {
          // Initialize the building entry
          buildings[key] = {
            name: requirement.name,
            totalAmount: 0,
            powerPerBuilding: requirement.powerPerBuilding,
            totalPower: 0,
          }
        }

        // Accumulate the total amount and total power
        buildings[key].totalAmount += requirement.amount
        buildings[key].totalPower += requirement.totalPower
      }
    )
  })
  // Return sorted array of buildings
  return Object.values(buildings).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export const calculateTotalRawResources = (factories: Factory[]) => {
  const rawResources: Record<string, { id: string; totalAmount: number }> = {}

  factories.forEach(factory => {
    Object.values(factory.rawResources).forEach(resource => {
      if (!rawResources[resource.id]) {
        // Initialize the raw resource entry
        rawResources[resource.id] = {
          id: resource.id,
          totalAmount: 0,
        }
      }

      // Accumulate the resource amount
      rawResources[resource.id].totalAmount += resource.amount
    })
  })

  // Convert the object to an array and sort it alphabetically by display name
  return Object.values(rawResources).sort((a, b) =>
    getPartDisplayName(a.id).localeCompare(getPartDisplayName(b.id))
  )
}

export const calculateTotalProducedItems = (factories: Factory[]) => {
  const products: Record<
      string,
      { id: string, name: string; totalAmount: number; totalDifference: number }
    > = {}

  factories.forEach(factory => {
    factory.products.forEach(product => {
      if (!products[product.id]) {
        products[product.id] = {
          id: product.id,
          name: getPartDisplayName(product.id) ?? product.id,
          totalAmount: 0,
          totalDifference: 0,
        }
      }

      // Accumulate the product amount
      products[product.id].totalAmount += product.amount

      // Add the difference if metrics exist
      if (hasMetricsForPart(factory, product.id)) {
        const difference =
            factory.dependencies.metrics[product.id]?.difference ?? 0
        products[product.id].totalDifference += difference
      }
    })
  })

  // Convert the object to an array and sort it alphabetically by display name
  return Object.values(products).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export const calculateProducedItemsDifference = (factories: Factory[]) => {
  const differences: Record<string, {id: string, name: string; totalDifference: number }> =
      {}

  factories.forEach(factory => {
    Object.entries(factory.dependencies.metrics).forEach(([partId, metric]) => {
      if (metric.difference !== 0) {
        if (!differences[partId]) {
          differences[partId] = {
            id: partId,
            name: getPartDisplayName(partId) ?? partId,
            totalDifference: 0,
          }
        }
        // Accumulate the difference
        differences[partId].totalDifference += metric.difference
      }
    })
  })

  return Object.values(differences).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}
