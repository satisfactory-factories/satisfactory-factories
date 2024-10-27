import { Factory } from '@/interfaces/planner/FactoryInterface'

export const calculateHasProblem = (factories: Factory[]) => {
  // Loop all factories to detect if they have problems
  factories.forEach(factory => {
    factory.hasProblem = false

    let hasProblem = false
    // If any of the requirements are not satisfied, we have a problem.

    if (!factory.requirementsSatisfied) {
      hasProblem = true
    }

    // Loop through all of the dependency metrics of a factory and ensure all requests are satisfied.
    Object.keys(factory.dependencies.metrics).forEach(part => {
    // We need to have !hasProblem because we don't want to overwrite the hasProblem flag if it's already set.
      if (!hasProblem && !factory.dependencies.metrics[part].isRequestSatisfied) {
        hasProblem = true
      }
    })

    factory.hasProblem = hasProblem
  })
}
