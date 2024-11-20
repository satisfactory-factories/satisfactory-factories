import { Factory, FactoryExportItem, FactoryItem } from '@/interfaces/planner/FactoryInterface'

export const getRequestsForFactoryByProduct = (
  factory: Factory,
  part: string
): FactoryExportItem[] => {
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

  // Create a new object returning the requests for the specific part, injecting the factory ID.
  // They can only ever request one part from us, so return it as a flat array.
  return Object.entries(factoryRequests).map(([factoryId, requests]) => {
    return requests.filter(request => request.part === part).map(request => {
      return {
        ...request,
        factoryId: parseInt(factoryId, 10),
      }
    })
  }).flat()
}

export const productSurplus = (product: FactoryItem, factory: Factory) => {
  const part = factory.parts[product.id]
  return part.amountRemaining < 0 ? part.amountRemaining : 0
}

export const calculateExports = (factories: Factory[]) => {
  factories.forEach(factory => {
    factory.exports = {}
    // Get the products from the factory, and filter out any products that BOTH do not have a surplus and are NOT requested by other factories
    const products = Object.entries(factory.products ?? {})
    if (products.length === 0) {
      return []
    }

    // Map through the products and check if the product both has a surplus or requests set upon it
    const factoryExports = factory.products.map(([key, product]) => {
    // Now check if the product has any demands set upon it by other factories
      const requests = getRequestsForFactoryByProduct(factory, product.id)

      if (requests.length === 0 && productSurplus(product, factory) > 0) {
        return null // Return null when product is not requested by other factories and has no surplus
      }

      const byProduct = factory.byProducts.find(byProduct => byProduct.id === product.id)

      // If byproduct, we need to get the product to get the display order
      const productParent = byProduct ? factory.products.filter(product => product.id === byProduct.byProductOf)[0] : product
      const displayOrder = productParent?.displayOrder ?? 0

      return {
        amount: productSurplus(product, factory) ?? 0,
        demands: requests.reduce((acc, request) => acc + request.amount, 0),
        displayOrder,
      }
    })

    // Filter out any `null` values from the mapped array, keeps typescript happy
    const validExports = factoryExports.filter(item => item !== null)

    // Sort the filtered surplus entries based on sortOrder
    validExports.sort((a, b) => {
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

    validExports.forEach((exportItem, index) => {
      factory.exports[index] = exportItem
    })
  })
}
