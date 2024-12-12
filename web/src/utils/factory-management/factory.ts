import { BuildingRequirement, Factory, FactoryDependency, FactoryPower } from '@/interfaces/planner/FactoryInterface'
import { calculateProducts } from '@/utils/factory-management/products'
import { calculateFactoryBuildingsAndPower } from '@/utils/factory-management/buildings'
import { calculateParts } from '@/utils/factory-management/parts'
import {
  calculateDependencies,
  calculateDependencyMetrics,
  calculateDependencyMetricsSupply,
  scanForInvalidInputs,
} from '@/utils/factory-management/dependencies'
import { calculateHasProblem } from '@/utils/factory-management/problems'
import { DataInterface } from '@/interfaces/DataInterface'
import eventBus from '@/utils/eventBus'
import { calculateSyncState } from '@/utils/factory-management/syncState'
import { calculatePowerProducers } from '@/utils/factory-management/power'
import { markRaw } from 'vue'

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

export const newFactory = (name = 'A new factory', order?: number, id?: number): Factory => {
  return {
    id: id ?? Math.floor(Math.random() * 10000),
    name,
    products: [],
    byProducts: [],
    powerProducers: [],
    inputs: [],
    previousInputs: [],
    parts: {},
    buildingRequirements: {} as { [p: string]: BuildingRequirement },
    dependencies: {
      requests: {},
      metrics: {},
    } as FactoryDependency,
    exportCalculator: {},
    rawResources: {},
    power: {} as FactoryPower,
    requirementsSatisfied: true, // Until we do the first calculation nothing is wrong
    usingRawResourcesOnly: false,
    hidden: false,
    hasProblem: false,
    inSync: null,
    syncState: {},
    displayOrder: order ?? -1, // this will get set by the planner
    tasks: [],
    notes: '',
  }
}

// We update the factory in layers of calculations. This makes it much easier to conceptualize.
export const calculateFactory = (
  factory: Factory,
  allFactories: Factory[],
  gameData: DataInterface
) => {
  console.log('Calculating factory:', factory.name)
  console.time(`calculateFactory: ${factory.name}`)

  factory.rawResources = {}
  factory.parts = {}

  // Calculate what is produced and required by the products.
  calculateProducts(factory, gameData)

  // Calculate if there have been any changes the player needs to enact.
  calculateSyncState(factory)

  // Calculate the generation of power for the factory
  calculatePowerProducers(factory, gameData)

  // Calculate the amount of buildings and power required to make the factory and any power generation.
  calculateFactoryBuildingsAndPower(factory, gameData)

  // Calculate the dependency metrics for the factory.
  calculateDependencyMetrics(factory)

  // Then we calculate the satisfaction of the factory. This requires Dependencies to be calculated first.
  calculateParts(factory, gameData)

  // After now knowing what our supply is, we need to recalculate the dependency metrics.
  calculateDependencyMetricsSupply(factory)

  // Export Calculator stuff
  // configureExportCalculator(allFactories)

  // Finally, go through all factories and check if they have any problems.
  calculateHasProblem(allFactories)

  // Emit an event that the data has been updated so it can be synced
  eventBus.emit('factoryUpdated')

  console.timeEnd(`calculateFactory: ${factory.name}`)

  return factory
}

export const calculateFactories = async (factories: Factory[], gameData: DataInterface, loadMode = false): Promise<void> => {
  // Take a clone of the current data object, so we can do the math upon it then replace it so Vue isn't doing so much reactivity stuff.
  const clonedFactories: Factory[] = markRaw(JSON.parse(JSON.stringify(factories)))

  // If we're loading via template, we need to run calculations FIRST then dependencies then calculations again.
  // The reason why we have to do this is we generate the factories out of products and inputs configurations, which then need to be calculated first before we can calculate the dependencies.
  // Otherwise, the part data that the invalidInputs check depends upon won't be present, and it will nuke all the import links.
  if (loadMode) {
    console.log('factory-management: calculateFactories: Preloading calculations')
    clonedFactories.forEach(factory => {
      calculateFactory(factory, clonedFactories, gameData)
    })
    calculateDependencies(clonedFactories)
    scanForInvalidInputs(clonedFactories)
    clonedFactories.forEach(factory => {
      calculateFactory(factory, clonedFactories, gameData)
    })
  } else {
    console.log('factory-management: calculateFactories')

    // Construct the dependencies between factories.
    console.time('calculateDependencies')
    calculateDependencies(clonedFactories)
    console.timeEnd('calculateDependencies')

    // Check if we have any invalid inputs.
    scanForInvalidInputs(clonedFactories)
    console.time('calculateFactory')
    clonedFactories.forEach(factory => calculateFactory(factory, clonedFactories, gameData))
    console.timeEnd('calculateFactory')
  }

  // Replace the factories with the new calculated factories.
  factories.splice(0, factories.length, ...clonedFactories)

  // Wait for Vue to finish all updates.
  await nextTick()
}

export const countActiveTasks = (factory: Factory) => {
  return factory.tasks.filter(task => !task.completed).length
}
