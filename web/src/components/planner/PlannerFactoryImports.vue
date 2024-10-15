<template>
  <div>
    <h1 class="text-h5 mb-4">
      <i class="fas fa-arrow-to-right" />
      <span class="ml-3">Imports</span>
    </h1>
    <div v-if="Object.keys(factory.rawResources).length > 0 || Object.keys(factory.partRequirements).length > 0">
      <v-card v-if="Object.keys(factory.rawResources).length > 0" class="mb-4 border">
        <v-card-title><i class="fas fa-hard-hat" /> Raw Resources</v-card-title>
        <v-card-text>
          <p v-show="helpText" class="text-body-2 mb-4">
            <i class="fas fa-info-circle" /> Raw resources (e.g. Iron Ore) aren't defined as imports. It is assumed you'll supply them sufficiently.
          </p>
          <div v-for="(resource, resourceKey) in factory.rawResources" :key="resource">
            <p class="text-body-1">
              <b>{{ getPartDisplayName(resourceKey) }}</b>: {{ resource.amount }} /min
            </p>
          </div>
        </v-card-text>
      </v-card>
      <p v-show="helpText" class="text-body-2 mb-4">
        <i class="fas fa-info-circle" /> Imports are the resources needed to produce the factory's products and ensure its satisfaction. To set up imports, you select another factory and choose one of its outputs. This creates a "request" for that output. The selected factory must fulfill this request, and you'll be notified if it cannot meet the demand. All available outputs are listed in the Outputs section of the factory you choose.
      </p>
      <v-row
        v-for="(input, inputIndex) in factory.inputs"
        :key="inputIndex"
        class="pa-0 my-2 mx-1 align-center selectors"
      >
        <v-autocomplete
          v-model="input.factoryId"
          class="mr-6"
          hide-details
          :items="validImportFactories(factory, inputIndex)"
          label="Factory"
          prepend-icon="fas fa-industry"
          variant="outlined"
          width="300px"
          @update:model-value="(newValue) => handleFactoryChange(newValue, factory, inputIndex)"
        />
        <v-autocomplete
          v-model="input.outputPart"
          class="mr-2"
          hide-details
          :items="getFactoryOutputsForAutocomplete(input.factoryId)"
          label="Item"
          prepend-icon="fas fa-cube"
          variant="outlined"
          width="300px"
          @update:model-value="(newValue) => handleItemChange(newValue, factory, inputIndex)"
        />
        <v-text-field
          v-model.number="input.amount"
          class="mr-2"
          hide-details
          label="Amount"
          max-width="110px"
          type="number"
          variant="outlined"
          @input="updateFactory(factory)"
        />
        <v-btn
          class="rounded"
          color="red"
          icon="fas fa-trash"
          @click="deleteInput(inputIndex, factory)"
        />
      </v-row>
      <v-btn
        v-show="Object.keys(factory.partRequirements).length > 0"
        color="green"
        :disabled="!hasAvailableImports(factory)"
        prepend-icon="fas fa-dolly"
        ripple
        :variant="hasAvailableImports(factory) ? 'flat' : 'outlined'"
        @click="addEmptyInput(factory)"
      >Add Import
      </v-btn>
      <span v-if="ableToImport(factory) === 'noFacs'" class="ml-2">(Add another Factory with Exports!)</span>
      <span v-if="ableToImport(factory) === 'rawOnly'" class="ml-2">(This factory is only using raw resources and requires no import from other factories)</span>
      <span v-if="ableToImport(factory) === 'noImportFacs'" class="ml-2">(There are no factories that have exports able to supply this factory.)</span>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import { Factory } from '@/interfaces/planner/Factory'

  const findFactory = inject('findFactory') as (id: string | number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const validFactoriesForImports = inject('factoriesWithSurplus') as ComputedRef<Factory[]>

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const addEmptyInput = (factory: Factory) => {
    factory.inputs.push({
      factoryId: 0,
      outputPart: '',
      amount: 0,
    })
  }

  const deleteInput = (inputIndex: number, factory: Factory) => {
    factory.inputs.splice(inputIndex, 1)
    updateFactory(factory)
  }

  // Check if the factory is able to import requirements from other factories
  const possibleImports = computed(() => {
    const factories = []

    // Loop through each part in the requirements of the current factory prop
    for (const part in props.factory.partRequirements) {
      // Find any factories that have a surplus of this part
      const availableFactories = validFactoriesForImports.value.filter(
        oFac => oFac.surplus[part] && oFac.surplus[part].amount > 0
      )

      // Add those factories to the list of possible imports if they have a surplus
      factories.push(...availableFactories)
    }

    return factories
  })

  const ableToImport = (factory: Factory): string | boolean => {
    const otherFactories = validFactoriesForImports.value.filter(f => f.id !== factory.id)

    if (factory.usingRawResourcesOnly) {
      return 'rawOnly'
    }

    if (otherFactories.length === 0) {
      return 'noFacs'
    }

    if (!hasAvailableImports(factory)) {
      return 'noImportFacs'
    }

    return true
  }

  const getValidImportFactories = (factory: Factory, inputIndex: number | null = null) => {
    // Get all factories that are not the current factory
    const otherFactories = possibleImports.value.filter(f => f.id !== factory.id)

    // Get a list of all existing input factory IDs excluding the current input index if provided
    const allInputFactoryIds = factory.inputs
      .filter((_, index) => inputIndex === null || index !== inputIndex) // If inputIndex is null, ignore filtering
      .map(input => input.factoryId)

    // Iterate through other factories and build the valid options list
    return otherFactories.filter(otherFactory => {
      // Check if the factory is already selected by another input
      return !allInputFactoryIds.includes(otherFactory.id)
    })
  }

  // This looks like spaghetti, but it actually does work somehow.
  const validImportFactories = (factory: Factory, inputIndex: number) => {
    // Get all factories that are not the current factory
    const otherFactories = possibleImports.value.filter(f => f.id !== factory.id)

    // Get a list of all existing input factory IDs excluding the current input index
    const allInputFactoryIds = factory.inputs
      .filter((_, index) => index !== inputIndex) // Exclude the current input index to preserve its value
      .map(input => input.factoryId)

    // Iterate through other factories and build the valid options list
    const validFactories = otherFactories.filter(otherFactory => {
      // Check if the factory is already selected by another input
      return !allInputFactoryIds.includes(otherFactory.id)
    })

    // Add the currently selected factory as an option to preserve existing selection
    const currentInputFactoryId = factory.inputs[inputIndex]?.factoryId

    // Check if currentInputFactoryId is valid and should be added
    if (currentInputFactoryId) {
      const selectedFactory = possibleImports.value.find(f => f.id === currentInputFactoryId)

      if (selectedFactory && !validFactories.some(f => f.id === selectedFactory.id)) {
        validFactories.push(selectedFactory)
      }
    }

    // Always insert "Select a Factory" as an option to prevent showing 0 upon adding the input
    validFactories.unshift({
      id: 0,
      name: 'Select a Factory',
    })

    // Map to the required format for the dropdown
    return validFactories.map(f => ({
      title: f.name,
      value: f.id,
    }))
  }

  const hasAvailableImports = (factory: Factory): boolean => {
    // Get valid factories using the core function with `inputIndex` set to `null` to consider all current inputs
    const validFactories = getValidImportFactories(factory, false, null)

    return validFactories.length > 0
  }

  // Gets the products of another factory for dependencies
  const getFactoryOutputsForAutocomplete = (factoryId: number | undefined, inputIndex: number): string[] => {
    if (factoryId !== 0 && !factoryId) {
      console.error('Tried to get products for an undefined factory ID.')
      return []
    }

    // If the factory is 0, it's a placeholder for a new input, do no nothing
    if (factoryId === 0) {
      return []
    }

    // Get the factory by ID
    const factory = findFactory(factoryId)

    if (!factory || !factory.id) {
      console.error('Tried to get outputs for a factory that does not exist:', factoryId)
      return []
    }

    if (factory.products.length === 0) {
      console.error('Tried to get outputs of a group with no products.')
      return []
    }

    // Ensure that we're not returning the same factory as requested, and return as an array for rendering.
    // It must be in the format of [ { title: 'Item Name', value: 'Item ID' } ]
    return Object.keys(factory.surplus).map(item => {
      return {
        title: getPartDisplayName(item),
        value: item,
      }
    })
  }

  const handleFactoryChange = (newValue, factory, index) => {
    // Update the factoryId for the specific input
    factory.inputs[index].factoryId = newValue

    // Trigger recalculations or any side effects needed
    updateFactory(factory)
  }

  const handleItemChange = (newValue, factory, index) => {
    // Update the outputPart for the specific input
    factory.inputs[index].outputPart = newValue

    // Trigger recalculations or any side effects needed
    updateFactory(factory)
  }
</script>
