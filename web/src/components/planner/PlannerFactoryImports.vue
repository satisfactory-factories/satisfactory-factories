<template>
  <div>
    <h1 class="text-h5 mb-4"><i class="fas fa-arrow-to-right"/> Imports</h1>
    <div v-if="Object.keys(group.rawResources).length > 0 || Object.keys(group.partsRequired).length > 0">
      <v-card v-if="Object.keys(group.rawResources).length > 0" class="mb-4 border">
        <v-card-title><i class="fas fa-hard-hat"/> Raw Resources</v-card-title>
        <v-card-text>
          <div v-for="(inputIndex) in group.rawResources" :key="inputIndex">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle"/> Raw resources (e.g. Iron Ore) aren't defined as imports. It
              is assumed you'll supply them sufficiently.
            </p>
            <p v-for="(resource, resourceIndex) in group.rawResources" :key="resourceIndex"
               class="text-body-1 mt-4">
              <b>{{ resource.name }}</b>: {{ resource.amount }}/min
            </p>
          </div>
        </v-card-text>
      </v-card>
      <v-row v-for="(input, inputIndex) in group.inputs" :key="inputIndex"
             style="padding: 0; margin: 10px 0">
        <v-autocomplete
          v-model="input.groupId"
          :items="autocompleteInputFactoriesForGroup(group)"
          hide-details
          label="Factory"
          max-width="400px"
          prepend-icon="fas fa-industry"
          style="margin-right: 20px"
          variant="outlined"
          @update:modelValue="updateFactory(group)"
        >
        </v-autocomplete>
        <v-autocomplete
          v-model="input.outputPart"
          :items="getFactoryOutputsForAutocomplete(input.groupId)"
          hide-details
          label="Product"
          max-width="400px"
          prepend-icon="fas fa-cube"
          style="margin-right: 20px"
          variant="outlined"
          @update:modelValue="updateFactory(group)">
        </v-autocomplete>
        <v-text-field
          v-model.number="input.amount"
          hide-details
          label="Amount"
          max-width="125px"
          style="margin-right: 10px"
          type="number"
          variant="outlined"
          @input="updateFactory(group)"
        />
        <v-btn
          color="red"
          icon="fas fa-trash"
          rounded="0"
          @click="deleteInput(inputIndex, group)"/>
      </v-row>
      <v-btn
        v-show="Object.keys(group.partsRequired).length > 0"
        :disabled="validFactoriesForImports.length === 0"
        color="green"
        prepend-icon="fas fa-dolly"
        ripple
        @click="addEmptyInput(group)"
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
  group: Factory;
}>();

const findFactory = inject('findFactory') as (id: number) => Factory;
const updateFactory = inject('updateFactory') as (factory: Factory) => void;
const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string;
const validFactoriesForImports = inject('validFactoriesForImports') as Factory[];

const addEmptyInput = (factory: Factory) => {
  factory.inputs.push({
    groupId: 0,
    outputPart: '',
    amount: 0,
  });
}

const deleteInput = (inputIndex: number, factory: Factory) => {
  factory.inputs.splice(inputIndex, 1)
  updateFactory(factory)
}

const autocompleteInputFactoriesForGroup = (factory: Factory) => {
  // Get the current list of all valid inputs
  const validInputs = this.validFactoriesForImports;

  // Filter the valid inputs by group that is not the current
  const relevantInputs = validInputs.filter((input) => input.id !== factory.id);

  // Now create an array in the format of { title: 'group.name', value: 'groupid' }
  return relevantInputs.map((input) => {
    return {
      title: input.name,
      value: input.id,
    };
  });
}

// Gets the products of another group for dependencies
const getFactoryOutputsForAutocomplete = (factoryId: number | undefined): string[] => {
  if (factoryId !== 0 && !factoryId) {
    console.error('Tried to get products for an undefined group ID.');
    return [];
  }

  // Get the group by ID, we can't use [ref]
  const factory = findFactory(fac => fac.id === factoryId);

  if (!factory || !factory.id) {
    console.error('Tried to get products for a group that does not exist:', factoryId);
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
</script>
