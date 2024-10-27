import {
  BuildingRequirement, Factory,
  FactoryDependency,
} from '@/interfaces/planner/FactoryInterface'

export const createMockFactory = (name = 'A new factory'): Factory => {
  return {
    id: Math.floor(Math.random() * 10000),
    name,
    products: [],
    internalProducts: {},
    inputs: [],
    parts: {},
    buildingRequirements: {} as { [p: string]: BuildingRequirement },
    requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
    totalPower: '0',
    dependencies: {} as FactoryDependency,
    exportCalculator: {},
    rawResources: {},
    usingRawResourcesOnly: false,
    surplus: {},
    hidden: false,
    hasProblem: false,
    displayOrder: 1,
  }
}

export const addMockFactoryProduct = (factory: Factory, productInfo: {
  id: string,
  amount: number,
  recipe: string
}) => {
  factory.products.push({
    id: productInfo.id,
    amount: productInfo.amount,
    recipe: productInfo.recipe,
    requirements: {},
    buildingRequirements: {} as BuildingRequirement,
    byProducts: [],
    displayOrder: 0,
  })
}

export const addMockFactoryInput = (factory: Factory, inputInfo: {
  factoryId: number | null,
  outputPart: string | null,
  amount: number
}) => {
  factory.inputs.push(inputInfo)
}
