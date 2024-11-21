import { Factory, FactoryDependencyRequest, FactoryExportItem, FactoryItem } from '@/interfaces/planner/FactoryInterface'

export const getRequestsForFactoryByProduct = (
  factory: Factory,
  part: string
): FactoryDependencyRequest[] => {
  // If sent an empty factory, there's no request.
  if (!factory) {
    return []
  }
  // Return an object containing the requests of all factories requesting a particular part
  // We need to get all requests set upon by other factories and check their part names
  // If the part name matches the one we're looking for, we add it to the list.
  const factoryRequests = factory.dependencies.requests

  if (!factoryRequests || Object.keys(factoryRequests).length === 0) {
    return []
  }

  // Return all requests for a particular part
  return Object.entries(factoryRequests)
    .map(([factoryId, requests]) => {
      return requests.filter(request => request.part === part)
    })
    .flat()
}

export const productSurplus = (product: FactoryItem, factory: Factory) => {
  const part = factory.parts[product.id]

  // Return a positive value as negative values == surplus
  return part.amountRemaining < 0 ? Math.abs(part.amountRemaining) : 0
}

export const calculateExports = (factories: Factory[]) => {
  factories.forEach(factory => {
    factory.exports = {}
    // Get the products from the factory, and filter out any products that BOTH do not have a surplus and are NOT requested by other factories
    if (factory.products.length === 0) {
      return []
    }

    // Map through the products and check if the product both has a surplus or requests set upon it
    const factoryExports: FactoryExportItem[] = factory.products
      .map(product => {
        const requests = getRequestsForFactoryByProduct(factory, product.id)

        if (requests.length === 0 && productSurplus(product, factory) <= 0) {
          return null // Skip products with no requests and no surplus
        }

        const byProduct = factory.byProducts.find(byProduct => byProduct.id === product.id)

        // If byproduct, we need to get the product to get the display order
        const productParent = byProduct
          ? factory.products.find(product => product.id === byProduct.byProductOf)
          : product

        const data = {
          productId: product.id,
          surplus: productSurplus(product, factory) ?? 0,
          demands: factory.dependencies.metrics[product.id]?.request ?? 0,
          difference: 0,
          displayOrder: productParent?.displayOrder ?? 0,
        }
        data.difference = data.surplus - data.demands
        return data
      })
      .filter((item): item is FactoryExportItem => item !== null)
      .sort((a, b) => {
      // If either display order is null, push it to the end
        if (a.displayOrder === null || b.displayOrder === null) {
          return a.displayOrder === null ? 1 : -1
        }
        if (a.displayOrder && b.displayOrder) {
          return a.displayOrder - b.displayOrder
        } else if (a.displayOrder) {
          return 1 // Push entries without sortOrder to the end
        } else {
          return -1
        }
      })

    factoryExports.forEach(exportItem => {
      factory.exports[exportItem.productId] = exportItem
    })
  })
}
