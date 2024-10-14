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
          :items="validInputsForFactoriesAutocomplete(factory, inputIndex)"
          label="Factory"
          max-width="400px"
          prepend-icon="fas fa-industry"
          variant="outlined"
          @update:model-value="(newValue) => handleFactoryChange(newValue, factory, inputIndex)"
        />
        <v-autocomplete
          v-model="input.outputPart"
          class="mr-2"
          hide-details
          :items="getFactoryOutputsForAutocomplete(input.factoryId)"
          label="Item"
          max-width="400px"
          prepend-icon="fas fa-cube"
          variant="outlined"
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
        :disabled="validFactoriesForImports.length === 0"
        prepend-icon="fas fa-dolly"
        ripple
        @click="addEmptyInput(factory)"
      >Add Import <span
        v-if="validFactoriesForImports.length === 0"
      >(Add another Factory with Exports!)</span>
      </v-btn>
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
  const validFactoriesForImports = inject('validFactoriesForImports') as ComputedRef<Factory[]>

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

  const validInputsForFactoriesAutocomplete = (factory: Factory, inputIndex: number) => {
    // Get all factories that are not the current factory
    const otherFactories = validFactoriesForImports.value.filter(f => f.id !== factory.id)

    // Of the other factories, we need return factories that comply with the following rules:
    // 1. The factory is already selected by this input. We need this in order to return the factory as an option and it won't be de-rendered.
    // 2. The factory does not have an output we have already selected by this factory AND is not the same input index.
    // 3. The factory has a valid amount of surplus.
    return otherFactories.filter(f => {
      return (
        f.id === factory.inputs[inputIndex].factoryId ||
        !factory.inputs.some(input => input.factoryId === f.id && input.outputPart === factory.inputs[inputIndex].outputPart && inputIndex !== inputIndex) &&
        f.surplus[factory.inputs[inputIndex].outputPart] > 0
      )
    }).map(f => {
      return {
        title: f.name,
        value: f.id,
      }
    })
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
