import { Factory, FactoryItem, PartMetrics } from '@/interfaces/planner/FactoryInterface'
import { getProduct, shouldShowInternal } from '@/utils/factory-management/products'
import { getAllInputs } from '@/utils/factory-management/inputs'

export const showSatisfactionItemButton = (
  factory: Factory,
  partId: string,
  type: string
) => {
  const part = factory.parts[partId]
  if (!part) {
    console.error(`satisfaction: showSatisfactionItemButton: Part ${partId} not found in factory.`)
    return null
  }

  switch (type) {
    case 'addProduct':
      return showAddProduct(factory, part, partId)
    case 'fixProduct':
      return showFixProduct(factory, part, partId)
    case 'correctManually':
      return showCorrectManually(factory, part, partId)
    case 'fixImport':
      return showFixImport(factory, part, partId)
    default:
      return null
  }
}

export const showAddProduct = (factory: Factory, part: PartMetrics, partId: string) => {
  return !getProduct(factory, partId) && !part.isRaw && !part.satisfied
}

export const showFixProduct = (factory: Factory, part: PartMetrics, partId: string) => {
  return getProduct(factory, partId, true) && !part.isRaw && !part.satisfied
}

export const showCorrectManually = (factory: Factory, part: PartMetrics, partId: string) => {
  const isByProduct = factory.byProducts.find(byProduct => byProduct.id === partId)
  // If the product is already a byproduct, isn't raw and isn't satisfied, show it
  if (isByProduct && !part.isRaw && !part.satisfied) {
    return true
  }

  // Beyond a byproduct, we don't care about it's state
  return false
}

export const showFixImport = (factory: Factory, part: PartMetrics, partId: string) => {
  const input = getAllInputs(factory, partId)
  if (input.length > 1 && !part.satisfied) {
    return 'multiple'
  }
  return input[0]?.outputPart && !part.satisfied
}

// Satisfaction item chips
export const showProductChip = (factory: Factory, partId: string) => {
  return !!getProduct(factory, partId, true)
}
export const showByProductChip = (factory: Factory, partId: string) => {
  return !!getProduct(factory, partId, false, true)
}
export const showImportedChip = (factory: Factory, partId: string) => {
  return getAllInputs(factory, partId).length > 0
}
export const showRawChip = (factory: Factory, partId: string) => {
  return factory.parts[partId].isRaw
}
export const showInternalChip = (factory: Factory, partId: string) => {
  const product = getProduct(factory, partId, true) as FactoryItem
  if (!product) {
    return false
  }
  return shouldShowInternal(product, factory)
}
