import {
  BuildingRequirement,
  Factory,
  FactoryDependencyRequest,
  FactoryExportItem,
  FactoryItem,
} from '@/interfaces/planner/FactoryInterface'
import { createNewPart } from '@/utils/factory-management/common'

export const getRequestsForFactoryByProduct = (
  factory: Factory,
  part: string
): FactoryDependencyRequest[] => {
  // Return an object containing the requests of all factories requesting a particular part
  // We need to get all requests set upon by other factories and check their part names
  // If the part name matches the one we're looking for, we add it to the list.
  const factoryRequests = factory.dependencies.requests

  if (!factoryRequests || Object.keys(factoryRequests).length === 0) {
    return []
  }

  // Return all requests for a particular part
  return Object.entries(factoryRequests)
    .map(([, requests]) => {
      return requests.filter(request => request.part === part)
    })
    .flat()
}

export const productSurplus = (product: FactoryItem, factory: Factory) => {
  const part = factory.parts[product.id]
  if (!part) return 0

  // Return a positive value as negative values == surplus
  return part.amountRemaining > 0 ? part.amountRemaining : 0
}

export const calculateExports = (factories: Factory[]) => {
  factories.forEach(factory => {
    factory.exports = {}
    // Get the products from the factory, and filter out any products that BOTH do not have a surplus and are NOT requested by other factories
    if (factory.products.length === 0) {
      return []
    }

    // Hacky way to include byProducts but still leave the map to use 'FactoryItem'
    const mappedByProducts = factory.byProducts
      .map(byproduct => {
        const tempProduct: FactoryItem = {
          id: byproduct.id,
          recipe: '',
          amount: 0,
          displayOrder: 0,
          requirements: {},
          buildingRequirements: {} as BuildingRequirement,
        }

        return tempProduct
      })

    // Map through the products and check if the product both has a surplus or requests set upon it
    const factoryExports: FactoryExportItem[] = [...factory.products, ...mappedByProducts]
      .map(product => {
        // This always should be present at this calculation stage.
        if (!factory.parts[product.id]) {
          console.error(`Part data for ${product.id} not found in factory ${factory.name}!`)
          createNewPart(factory, product.id)
        }

        const byProduct = factory.byProducts.find(byProduct => byProduct.id === product.id)

        // If byproduct, we need to get the product to get the display order
        const productParent = byProduct
          ? factory.products.find(product => product.id === byProduct.byProductOf)
          : product

        const partData = factory.parts[product.id]
        const surplus = partData.amountRemaining
        const demands = partData.amountRequiredExports

        return {
          productId: product.id,
          surplus, // The surplus after production demands
          demands,
          supply: partData.amountSupplied, // For display purposes
          // Exportable being the amount remaining for export after export and internal demands are met
          displayOrder: productParent?.displayOrder ?? 0,
        }
      })
      .filter((item): item is FactoryExportItem => item !== null)
      .sort((a, b) => {
        return a.displayOrder < b.displayOrder ? 1 : -1
      })

    factoryExports.forEach(exportItem => {
      factory.exports[exportItem.productId] = exportItem
    })
  })
}
