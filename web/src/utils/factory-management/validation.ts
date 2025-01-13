// Check for invalid factory data e.g. inputs without factories etc
import { calculateFactory, findFac } from '@/utils/factory-management/factory'
import { Factory } from '@/interfaces/planner/FactoryInterface'
import { DataInterface } from '@/interfaces/DataInterface'

export const validateFactories = (factories: Factory[], gameData: DataInterface) => {
  let hasErrors = false

  factories.forEach(factory => {
    factory.inputs.forEach(input => {
      const inputFac = findFac(Number(input.factoryId), factories)
      if (!inputFac?.id) {
        hasErrors = true
        console.error(`VALIDATION ERROR: Factory "${factory.name}" (${factory.id}) has an input for ${input.factoryId} with part ${input.outputPart} where which the factory does not exist!`)

        // Remove the input
        const index = factory.inputs.findIndex(i => i.factoryId === input.factoryId)
        if (index !== -1) {
          factory.inputs.splice(index, 1)
        }
      }
    })

    // Check the dependencies to ensure the factories they're requesting exist
    Object.keys(factory.dependencies.requests).forEach(depFacId => {
      const inputFac = findFac(depFacId, factories)

      if (!inputFac.id) {
        hasErrors = true
        console.error(`VALIDATION ERROR: Factory "${factory.name}" (${factory.id}) has a dependency for factory ID ${depFacId} which does not exist!`)

        const requests = factory.dependencies.requests[depFacId]
        // Loop the requests and split out the parts
        requests.forEach(request => {
          console.error(`Part ${request.part} with amount ${request.amount}`)
        })

        // Remove the dependency
        delete factory.dependencies.requests[depFacId]
      }
    })

    // Check for invalid products and remove them from factories
    // For instance if somehow a product has an amount of 0, which should not be possible, remove the product and recalculate.
    factory.products.forEach((product, productIndex) => {
      if (product === null) {
        console.error(`VALIDATION ERROR: Factory "${factory.name}" (${factory.id}) has a product that is somehow null. Removing the product.`)
        factory.products.splice(productIndex, 1)
      }

      if (product && product.amount <= 0) {
        hasErrors = true
        console.error(`VALIDATION ERROR: Factory "${factory.name}" (${factory.id}) has a product with an amount of 0 or less. Setting to 1.`)

        product.amount = 1
      }

      if (factory.products.length === 0) {
        factory.products = [] // Ensure there's no lurking bad data
      }

      // Recalculate right now
      calculateFactory(factory, factories, gameData)
    })

    console.log('FACTORY PRODUCTS', factory.products)
  })

  if (hasErrors) {
    alert('There were errors loading your factory data. Please check the browser console for more details. Firefox: Control + Shift + K, Chrome: Control + Shift + J. Look for "VALIDATION ERROR:".\n\nThe planner has made corrections so you can continue planning.')
  }
}
