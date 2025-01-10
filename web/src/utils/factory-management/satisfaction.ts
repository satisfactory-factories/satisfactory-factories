import { Factory, FactoryItem, PartMetrics } from '@/interfaces/planner/FactoryInterface'
import { getProduct, shouldShowInternal } from '@/utils/factory-management/products'
import { getInput } from '@/utils/factory-management/inputs'

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
      return false
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
  const input = getInput(factory, partId)
  return input?.outputPart && !part.satisfied
}

export const showProductChip = (factory: Factory, partId: string) => {
  return getProduct(factory, partId, true)
}
export const showByProductChip = (factory: Factory, partId: string) => {
  return getProduct(factory, partId, false, true)
}
export const showImportedChip = (factory: Factory, partId: string) => {
  return factory.inputs.find(input => input.outputPart === partId)
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
