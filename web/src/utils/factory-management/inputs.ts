// This simply loops through all the inputs and adds them to the parts object.
import { Factory } from '@/interfaces/planner/FactoryInterface'

export const addInputToFactory = (
  factory: Factory, options: {
    factoryId: number | null,
    outputPart: string | null,
    amount: number,
  }
) => {
  // Find any factory that has the same factoryId, outputPart combo as we're trying to add, if there is any throw an error
  if (factory.inputs.find(input => input.factoryId === options.factoryId && input.outputPart === options.outputPart)) {
    throw new Error(`addInputToFactory: Input with factoryId ${options.factoryId} and outputPart ${options.outputPart} already exists in factory ${factory.id}`)
  }

  factory.inputs.push({
    factoryId: options.factoryId,
    outputPart: options.outputPart,
    amount: options.amount,
  })
}

export const calculatePossibleImports = (factory: Factory, factoriesWithExports: Factory[]) => {
  const factoriesWithRequiredParts = new Map<number, Factory>()

  // Get all parts in the factory that have requirements. Do this by checking each item in the parts object for `amountRequired > 0`
  // This denotes parts that should be candidates for import, even if they have an internal production.
  // The list should be simply a list of part names
  const partsWithRequirements = Object.keys(factory.parts).filter(part => {
    return factory.parts[part].amountRequired > 0
  })

  // Loop through each part in the requirements of the current factory prop
  partsWithRequirements.forEach(requiredPart => {
    // Find any factories that are exporting this part
    const validFactories = factoriesWithExports.filter(importFac => {
      // Loop through all the factory's parts and see if they have any export candidates
      return Object.keys(importFac.parts).some(part => {
        const partData = importFac.parts[part]
        return part === requiredPart && partData.exportable
      })
    })

    validFactories.forEach(fac => factoriesWithRequiredParts.set(fac.id, fac))
  })

  // Remove the input's factory to prevent referencing itself
  if (factoriesWithRequiredParts.get(factory.id)) {
    factoriesWithRequiredParts.delete(factory.id)
  }

  const factoriesArray = Array.from(factoriesWithRequiredParts.values())

  // Sort the factories by name
  factoriesArray.sort((a, b) => a.name.localeCompare(b.name))

  return factoriesArray
}

export const calculateImportsAfterSelections = (factory: Factory, possibleImports: Factory[]) => {
  // Collate all the currently selected factories and their selected parts
  const selectedPartsByFactory = new Map<number, Set<string>>()
  factory.inputs.forEach(input => {
    if (input.factoryId && input.outputPart) {
      if (!selectedPartsByFactory.has(input.factoryId)) {
        selectedPartsByFactory.set(input.factoryId, new Set<string>())
      }
      const partSet = selectedPartsByFactory.get(input.factoryId)
      // Keep TS happy...
      if (!partSet) {
        throw new Error('Unable to setup set, this should not be possible!')
      }
      partSet.add(input.outputPart)
    }
  })
  // Collate all the possible parts that can be imported, that the factory needs
  const remainingFactories = new Map<number, Factory>()
  possibleImports.forEach(fac => {
    // If the factory is already selected, skip it
    if (selectedPartsByFactory.has(fac.id)) {
      return
    }

    // If the factory is not already selected, add it to the list
    remainingFactories.set(fac.id, fac)
  })

  return remainingFactories
}

export const calculateAbleToImport = (factory: Factory, possibleImportsAfterSelections: Map<number, Factory>): string | boolean => {
  if (factory.usingRawResourcesOnly) {
    return 'rawOnly'
  }

  if (possibleImportsAfterSelections.size === 0) {
    return 'noImportFacs'
  }

  return true
}
