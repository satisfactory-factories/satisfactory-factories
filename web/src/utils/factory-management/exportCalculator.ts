import { Factory } from '@/interfaces/planner/FactoryInterface'

export const configureExportCalculator = (factories: Factory[]) => {
  factories.forEach(factory => {
    // For each surplus product we need to make sure there is an export calculator setting associated with it
    Object.keys(factory.exports).forEach(part => {
      // If there's not already a record for this surplus product, create one now.
      if (!factory.exportCalculator[part]) {
        factory.exportCalculator[part] = {
          selected: null,
          factorySettings: {},
        }
      }

      // For readability
      const exportCalculatorSettings = factory.exportCalculator[part]

      // Now we need to check if the selected export calculator setting is still valid.
      if (exportCalculatorSettings.selected !== null && !factory.dependencies.requests[exportCalculatorSettings.selected]) {
        exportCalculatorSettings.selected = null
      }

      const requestKeys = Object.keys(factory.dependencies.requests)

      // If the selection has not yet been made, make it the first option now.
      if (exportCalculatorSettings.selected === null && requestKeys.length > 0) {
        exportCalculatorSettings.selected = requestKeys[0] ?? null
      }

      // We also need to pre-fill the factory settings for the requests
      requestKeys.forEach(request => {
        if (!exportCalculatorSettings.factorySettings[request]) {
          exportCalculatorSettings.factorySettings[request] = {
            trainTime: 123,
          }
        }
      })
    })
  })
}
