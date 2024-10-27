import { BuildingRequirement, Factory, FactoryDependency } from '@/interfaces/planner/FactoryInterface'

export const findFac = (factoryId: string | number, factories: Factory[]): Factory | null => {
  if (!factoryId) {
    console.warn('No factoryId provided to findFactory')
    return null
  }

  // Ensure factoryId is parsed to a number to match factories array ids
  const factory = factories.find(fac => fac.id === parseInt(factoryId.toString(), 10))
  if (!factory) {
    throw new Error(`Factory ${factoryId} not found!`)
  }
  return factory
}

export const newFactory = (name = 'A new factory'): Factory => {
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
    dependencies: {
      requests: {},
      metrics: {},
    } as FactoryDependency,
    exportCalculator: {},
    rawResources: {},
    usingRawResourcesOnly: false,
    surplus: {},
    hidden: false,
    hasProblem: false,
    displayOrder: -1, // this will get set by the planner
  }
}
