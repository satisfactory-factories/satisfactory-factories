import { Factory, PartMetrics } from '@/interfaces/planner/FactoryInterface'
import { getProduct } from '@/utils/factory-management/products'

export const showSatisfactionItemButton = (
  factory: Factory,
  partId: string,
  type: string
) => {
  const part = factory.parts[partId]
  if (!part) {
    console.error(`satisfaction: showSatisfactionItemButton: Part ${partId} not found in factory.`)
    return false
  }

  switch (type) {
    case 'addProduct':
      return showAddProduct(factory, part, partId)
    case 'fixProduct':
      return showFixProduct(factory, part, partId)
    case 'addManually':
      return showAddManually(factory, part, partId)
    case 'fixImport':
      return showFixImport(factory, part, partId)
    default:
      return false
  }
}

export const showAddProduct = (factory: Factory, part: PartMetrics, partId: string) => {
  return !getProduct(factory, partId) && !part.isRaw && !part.satisfied
}

export const showFixProduct = (factory: Factory, part: PartMetrics, partId: string) => {
  return getProduct(factory, partId, true) && !part.isRaw && !part.satisfied
}

export const showAddManually = (factory: Factory, part: PartMetrics, partId: string) => {
  return !getProduct(factory, partId, true) && !part.isRaw && !part.satisfied
}

export const showFixImport = (factory: Factory, part: PartMetrics, partId: string) => {
  const input = factory.inputs.find(input => input.outputPart === partId)
  return input?.outputPart && !part.satisfied
}
