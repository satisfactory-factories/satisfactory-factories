<template>
  <div>
    <h1 class="text-h5 mb-4"><i class="fas fa-arrow-to-right"/> Imports</h1>
    <div v-if="Object.keys(factory.rawResources).length > 0 || Object.keys(factory.partsRequired).length > 0">
      <v-card v-if="Object.keys(factory.rawResources).length > 0" class="mb-4 border">
        <v-card-title><i class="fas fa-hard-hat"/> Raw Resources</v-card-title>
        <v-card-text>
          <div v-for="(inputIndex) in factory.rawResources" :key="inputIndex">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle"/> Raw resources (e.g. Iron Ore) aren't defined as imports. It
              is assumed you'll supply them sufficiently.
            </p>
            <p v-for="(resource, resourceIndex) in factory.rawResources" :key="resourceIndex"
               class="text-body-1 mt-4">
              <b>{{ resource.name }}</b>: {{ resource.amount }}/min
            </p>
          </div>
        </v-card-text>
      </v-card>
      <v-row v-for="(input, inputIndex) in factory.inputs" :key="inputIndex"
             style="padding: 0; margin: 10px 0">
        <v-autocomplete
          v-model="input.factoryId"
          :items="validInputsForFactoriesAutocomplete(factory, inputIndex)"
          hide-details
          label="Factory"
          max-width="400px"
          prepend-icon="fas fa-industry"
          style="margin-right: 20px"
          variant="outlined"
          @update:modelValue="(newValue) => handleFactoryChange(newValue, factory, inputIndex)"
        />
        <v-autocomplete
          v-model="input.outputPart"
          :items="getFactoryOutputsForAutocomplete(input.factoryId)"
          hide-details
          label="Item"
          max-width="400px"
          prepend-icon="fas fa-cube"
          style="margin-right: 20px"
          variant="outlined"
          @update:modelValue="(newValue) => handleItemChange(newValue, factory, inputIndex)"
        />
        <v-text-field
          v-model.number="input.amount"
          hide-details
          label="Amount"
          max-width="125px"
          style="margin-right: 10px"
          type="number"
          variant="outlined"
          @input="updateFactory(factory)"
        />
        <v-btn
          color="red"
          icon="fas fa-trash"
          rounded="0"
          @click="deleteInput(inputIndex, factory)"
        />
      </v-row>
      <v-btn
        v-show="Object.keys(factory.partsRequired).length > 0"
        :disabled="validFactoriesForImports.length === 0"
        color="green"
        prepend-icon="fas fa-dolly"
        ripple
        @click="addEmptyInput(factory)"
      >Add Import <span
        v-if="validFactoriesForImports.length === 0">(Add another Factory with Exports!)</span>
      </v-btn>
    </div>
    <p v-else class="text-body-1">Awaiting product selection.</p>
  </div>
</template>

<script setup lang="ts">
import {defineProps} from 'vue';
import {Factory} from "@/interfaces/planner/Factory";

const props = defineProps<{
  factory: Factory;
  helpText: boolean;
}>();

const findFactory = inject('findFactory') as (id: string | number) => Factory;
const updateFactory = inject('updateFactory') as (factory: Factory) => void;
const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string;
const validFactoriesForImports = inject('validFactoriesForImports') as ComputedRef<Factory[]>;

const addEmptyInput = (factory: Factory) => {
  factory.inputs.push({
    factoryId: 0,
    outputPart: '',
    amount: 0,
  });
}

const deleteInput = (inputIndex: number, factory: Factory) => {
  factory.inputs.splice(inputIndex, 1)
  updateFactory(factory)
}

const validInputsForFactoriesAutocomplete = (factory: Factory, inputIndex: number) => {
  // Get a list of selected factory IDs for this particular factory, excluding the current input's index
  const selectedFactoryIds = factory.inputs
    .filter((_, index) => index !== inputIndex) // Exclude the current input index from filtering
    .map(input => input.factoryId);

  // Filter the valid import factories:
  // 1. Exclude factories that are already selected by other inputs.
  // 2. Exclude the current factory itself.
  const validImportFactories = validFactoriesForImports.value.filter(
    (input) => !selectedFactoryIds.includes(input.id) && input.id !== factory.id
  );

  // Inject a default option depending on whether there are valid factories available
  if (validImportFactories.length === 0) {
    validImportFactories.unshift({
      id: 0,
      name: 'No valid factories',
    });
  } else {
    validImportFactories.unshift({
      id: 0,
      name: 'Select a Factory',
    });
  }

  return validImportFactories.map((validFac) => ({
    title: validFac.name,
    value: validFac.id,
  }));
};


// Gets the products of another factory for dependencies
const getFactoryOutputsForAutocomplete = (factoryId: number | undefined, inputIndex: number): string[] => {
  if (factoryId !== 0 && !factoryId) {
    console.error('Tried to get products for an undefined factory ID.');
    return [];
  }

  // If the factory is 0, it's a placeholder for a new input, do no nothing
  if (factoryId === 0) {
    return [];
  }

  // Get the factory by ID
  const factory = findFactory(factoryId);

  if (!factory || !factory.id) {
    console.error('Tried to get outputs for a factory that does not exist:', factoryId);
    return [];
  }

  if (Object.values(factory.products).length === 0) {
    console.error('Tried to get outputs of a group with no products.');
    return [];
  }

  // Ensure that we're not returning the same factory as requested, and return as an array for rendering.
  // It must be in the format of [ { title: 'Item Name', value: 'Item ID' } ]
  return Object.keys(factory.surplus).map((item) => {
    return {
      title: getPartDisplayName(item),
      value: item,
    };
  });
}

const handleFactoryChange = (newValue, factory, index) => {
  // Update the factoryId for the specific input
  factory.inputs[index].factoryId = newValue;

  // Trigger recalculations or any side effects needed
  updateFactory(factory);
};

const handleItemChange = (newValue, factory, index) => {
  // Update the outputPart for the specific input
  factory.inputs[index].outputPart = newValue;

  // Trigger recalculations or any side effects needed
  updateFactory(factory);
};
</script>
