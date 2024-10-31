<template>
  <div>
    <h1 class="text-h5 mb-4">
      <i class="fas fa-arrow-to-right" />
      <span class="ml-3">Imports</span>
    </h1>
    <p v-show="helpText" class="text-body-2 mb-4">
      <i class="fas fa-info-circle" /> Imports are the resources needed to produce the factory's products and ensure its satisfaction. To set up imports, you select another factory and choose one of its outputs. This creates a "request" for that output. The selected factory must fulfill this request, and you'll be notified if it cannot meet the demand. All available outputs are listed in the Outputs section of the factory you choose.
    </p>
    <div v-if="Object.keys(factory.rawResources).length > 0 || Object.keys(factory.parts).length > 0">
      <v-card v-if="Object.keys(factory.rawResources).length > 0" class="mb-4 border-md sub-card">
        <v-card-title>
          <i class="fas fa-hard-hat" /><span class="ml-2">Raw Resources</span>
        </v-card-title>
        <v-card-text class="text-body-2">
          <p class="mb-4">
            <i class="fas fa-info-circle" /> Raw resources (e.g. Iron Ore) aren't defined as imports. It is assumed you'll supply them sufficiently. It seemed a little pointless to force you to make a factory to input it directly into a factory.
          </p>
          <div v-for="(resource, resourceKey) in factory.rawResources" :key="resourceKey">
            <v-chip
              class="sf-chip blue"
            >
              <game-asset :subject="resourceKey.toString() ?? 'unknown'" type="item" />
              <span class="ml-2">
                <b>{{ getPartDisplayName(resourceKey.toString()) }}</b>: {{ resource.amount }}/min
              </span>
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <v-row
        v-for="(input, inputIndex) in factory.inputs"
        :key="`${inputIndex}-${input.outputPart}`"
        class="px-4 py-3 my-2 mx-1 align-center selectors sub-card border-md rounded"
      >
        <v-autocomplete
          v-model="input.factoryId"
          class="mr-6"
          hide-details
          :items="validImportFactories(factory, inputIndex)"
          label="Factory"
          max-width="300px"
          prepend-icon="fas fa-industry"
          variant="outlined"
          @update:model-value="(newValue) => handleFactoryChange(newValue, factory, inputIndex)"
        />
        <span v-show="!input.outputPart" class="mr-2">
          <i class="fas fa-cube" style="width: 32px; height: 32px" />
        </span>
        <span v-if="input.outputPart" class="mr-2">
          <game-asset
            :key="input.outputPart"
            :subject="input.outputPart"
            type="item"
          />
        </span>
        <v-autocomplete
          v-model="input.outputPart"
          class="mr-2"
          :disabled="!input.factoryId"
          hide-details
          :items="getFactoryOutputsForAutocomplete(input.factoryId, inputIndex)"
          label="Item"
          max-width="300px"
          variant="outlined"
          @input="updateFactory(factory)"
        />
        <v-text-field
          v-model.number="input.amount"
          class="mr-2"
          :disabled="!input.outputPart"
          hide-details
          label="Qty /min"
          max-width="110px"
          type="number"
          variant="outlined"
          @input="updateFactory(factory)"
        />
        <v-btn
          v-show="input.amount > 0 && requirementSatisfied(factory, input.outputPart) && !inputOverflow(factory, input.outputPart)"
          class="rounded mr-2"
          color="green"
          :disabled="true"
          prepend-icon="fas fa-thumbs-up"
          size="default"
          variant="outlined"
        >Satisfied!</v-btn>
        <v-btn
          v-show="requirementSatisfied(factory, input.outputPart) && inputOverflow(factory, input.outputPart)"
          class="rounded mr-2"
          color="yellow"
          prepend-icon="fas fa-arrow-down"
          size="default"
          @click="updateInputToSatisfy(factory, input)"
        >Trim</v-btn>
        <v-btn
          v-show="input.outputPart && !requirementSatisfied(factory, input.outputPart)"
          class="rounded mr-2"
          color="green"
          prepend-icon="fas fa-arrow-up"
          size="default"
          @click="updateInputToSatisfy(factory, input)"
        >Satisfy</v-btn>
        <v-btn
          class="rounded"
          color="primary"
          :disabled="!input.factoryId"
          prepend-icon="fas fa-industry"
          size="default"
          variant="outlined"
          @click="navigateToFactory(input.factoryId)"
        >View</v-btn>
        <v-btn
          class="rounded ml-2"
          color="red"
          icon="fas fa-trash"
          size="small"
          variant="outlined"
          @click="deleteInput(inputIndex, factory)"
        />
      </v-row>
      <v-btn
        v-show="Object.keys(factory.parts).length > 0"
        color="green"
        :disabled="!hasAvailableImports(factory) || !hasValidImportsRemaining(factory)"
        prepend-icon="fas fa-dolly"
        ripple
        :variant="hasAvailableImports(factory) && hasValidImportsRemaining(factory) ? 'flat' : 'outlined'"
        @click="addEmptyInput(factory)"
      >Add Import
      </v-btn>
      <span v-if="ableToImport(factory) === 'noFacs'" class="ml-2">(Add another Factory with Exports!)</span>
      <span v-if="ableToImport(factory) === 'rawOnly'" class="ml-2">(This factory is only using raw resources and requires no imports.)</span>
      <span v-if="ableToImport(factory) === 'noImportFacs'" class="ml-2">(There are no factories that have exports able to supply this factory.)</span>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
  import { defineProps } from 'vue'
  import { Factory, FactoryInput, PartMetrics } from '@/interfaces/planner/FactoryInterface'
  import { addInputToFactory } from '@/utils/factory-management/inputs'
  import { getPartDisplayName } from '@/utils/helpers'

  const findFactory = inject('findFactory') as (id: string | number) => Factory
  const updateFactory = inject('updateFactory') as (factory: Factory) => void
  const validFactoriesForImports = inject('factoriesWithSurplus') as ComputedRef<Factory[]>
  const navigateToFactory = inject('navigateToFactory') as (id: number | null) => void

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const addEmptyInput = (factory: Factory) => {
    addInputToFactory(factory, {
      factoryId: null,
      outputPart: null,
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
    for (const part in props.factory.parts) {
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

    // Get a list of all existing input requests excluding the current input index if provided
    const existingRequests = factory.inputs
      .filter((_, index) => inputIndex === null || index !== inputIndex) // If inputIndex is null, include all inputs
      .map(input => ({ factoryId: input.factoryId, outputPart: input.outputPart }))

    // Iterate through other factories and build the valid options list
    return otherFactories.filter(otherFactory => {
      // Allow the factory if it's not already selected for the same output part from the same factory
      const alreadyRequestedPart = existingRequests.some(request => {
        // We only care if the inputIndex is provided
        if (inputIndex) {
          return request.factoryId === otherFactory.id && request.outputPart === factory.inputs[inputIndex].outputPart
        }
        return false
      })

      return !alreadyRequestedPart
    })
  }

  const validImportFactories = (factory: Factory, inputIndex: number) => {
    // Get a list of valid factories based on the current factory inputs
    let validFactories = getValidImportFactories(factory, inputIndex)

    // Get the current factory input details
    const currentInput = factory.inputs[inputIndex]
    const currentInputFactoryId = currentInput?.factoryId

    // If there's a current factory selected, ensure it is part of the options
    if (currentInputFactoryId) {
      const alreadyInList = validFactories.some(f => f.id === currentInputFactoryId)

      // Add the currently selected factory if it's not already in the list
      if (!alreadyInList) {
        const selectedFactory = possibleImports.value.find(f => f.id === currentInputFactoryId)
        if (selectedFactory) {
          validFactories.push(selectedFactory)
        }
      }
    }

    // Remove any duplicate entries based on factory IDs
    validFactories = validFactories.filter((factory, index, self) =>
      index === self.findIndex(f => f.id === factory.id)
    )

    // Map to the required format for the dropdown
    return validFactories.map(f => ({
      title: f.name,
      value: f.id,
    }))
  }

  const hasAvailableImports = (factory: Factory): boolean => {
    // Get valid factories using the core function with `inputIndex` set to `null` to consider all current inputs
    const validFactories = getValidImportFactories(factory, null)

    // Only return true if there's at least one factory with a surplus of a required part
    return validFactories.some(otherFactory => {
      return Object.keys(factory.parts).some(requiredPart => {
        return otherFactory.surplus[requiredPart] && otherFactory.surplus[requiredPart].amount > 0
      })
    })
  }

  const hasValidImportsRemaining = (factory: Factory): boolean => {
    // Check if there are still any valid imports remaining that are not already fully used
    return possibleImports.value.some(otherFactory => {
      return Object.keys(factory.parts).some(requiredPart => {
        const surplus = otherFactory.surplus[requiredPart]
        const totalRequested = factory.inputs
          .filter(input => input.outputPart === requiredPart && input.factoryId === otherFactory.id)
          .reduce((sum, input) => sum + input.amount, 0)
        return surplus && surplus.amount > totalRequested
      })
    })
  }

  // Gets the products of another factory for dependencies
  const getFactoryOutputsForAutocomplete = (factoryId: number | null, inputIndex: number) => {
    if (!factoryId || factoryId === 0) {
      // If factoryId is 0 or undefined, return an empty array to prevent any selection.
      return []
    }

    // Get the factory by ID
    const factory = findFactory(factoryId)
    if (!factory || !factory.id) {
      console.error('Tried to get outputs for a factory that does not exist:', factoryId)
      return []
    }

    // If there are no products available from the factory, return an empty array.
    if (factory.products.length === 0) {
      console.error('Tried to get outputs of a factory with no products.')
      return []
    }

    // Get a list of output parts that have already been selected for the same factory by other inputs (excluding the current input)
    const alreadySelectedParts = props.factory.inputs
      .filter((_, index) => index !== inputIndex && props.factory.inputs[index]?.factoryId === factoryId)
      .map(input => input.outputPart)
      .filter(part => part !== '') // Remove empty selections

    // Filter out already selected parts from the factory's available surplus
    return Object.keys(factory.surplus)
      .filter(partKey => !alreadySelectedParts.includes(partKey) && partKey in props.factory.parts) // Exclude already-selected parts and parts not required
      .map(partKey => ({
        title: getPartDisplayName(partKey), // For display purposes
        value: partKey, // Value is the ID
      }))
  }

  const handleFactoryChange = (newValue: number, factory: Factory, inputIndex: number) => {
    // Update the factoryId for the specific input
    factory.inputs[inputIndex].factoryId = newValue

    // Trigger recalculations or any side effects needed
    updateFactory(factory)
  }

  const requirementSatisfied = (factory: Factory, part: string | null): boolean => {
    if (!part) {
      console.warn('requirementSatisfied: No part provided for input satisfaction check. It could be the user has not properly selected an output part yet.')
      return false
    }
    const requirement = factory.parts[part]

    if (!requirement) {
      console.log(`handleFactoryChange: Could not find part requirement in factory for input satisfaction check. Part: ${part}`)
      return false
    }

    return requirement.amountRemaining <= 0
  }

  const inputOverflow = (factory: Factory, part: string | null): boolean => {
    if (!part) {
      console.error('inputOverflow: No part provided for input overflow check.')
      return false
    }
    const requirement = factory.parts[part]

    return requirement.amountRemaining < 0
  }

  const updateInputToSatisfy = (factory: Factory, input: FactoryInput) => {
    if (!input.outputPart) {
      console.error('updateInputToSatisfy: No output part selected for input:', input)
      return
    }
    const part: PartMetrics = factory.parts[input.outputPart]
    input.amount = part.amountRequired

    updateFactory(factory)
  }

</script>
