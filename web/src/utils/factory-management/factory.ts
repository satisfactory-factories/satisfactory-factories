import { BuildingRequirement, Factory, FactoryDependency } from '@/interfaces/planner/FactoryInterface'

export const findFac = (factoryId: string | number, factories: Factory[]): Factory => {
  // This should always be supplied, if not there's a major bug.
  if (!factoryId) {
    throw new Error('No factoryId provided to findFac')
  }

  // Ensure factoryId is parsed to a number to match factories array ids
  const factory = factories.find(fac => fac.id === parseInt(factoryId.toString(), 10))
  if (!factory) {
    throw new Error(`Factory ${factoryId} not found!`)
  }
  return factory
}

export const findFacByName = (name: string, factories: Factory[]): Factory => {
  // This should always be supplied, if not there's a major bug.
  if (!name) {
    throw new Error(`No name provided to findFacByName`)
  }

  // Ensure factoryId is parsed to a number to match factories array ids
  const factory = factories.find(fac => fac.name === name)
  if (!factory) {
    throw new Error(`Factory ${name} not found!`)
  }
  return factory
}

export const newFactory = (name = 'A new factory'): Factory => {
  return {
    id: Math.floor(Math.random() * 10000),
    name,
    products: [],
    byProducts: [],
    internalProducts: {},
    inputs: [],
    parts: {},
    buildingRequirements: {} as { [p: string]: BuildingRequirement },
    requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
    totalPower: 0,
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
