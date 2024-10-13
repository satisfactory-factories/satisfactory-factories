<template>
  <div>
    <h2
      v-show="factory.inputsSatisfied"
      class="text-h5 mb-4"
    >
      <i class="fas fa-check"/>
      Satisfaction
    </h2>
    <h2
      v-show="!factory.inputsSatisfied"
      class="text-h5 mb-4"
      style="color: red"
    >
      <i class="fas fa-times-square"/>
      Satisfaction
    </h2>

    <div v-if="Object.keys(factory.partsRequired).length > 0">
      <p v-show="helpText" class="text-body-2 mb-4">
        <i class="fas fa-info-circle"/> All entries are listed as [supply/demand]. Supply is created by
        adding imports to the factory.
      </p>

      <v-list bg-color="transparent">
        <v-list-item
          v-for="(part, partIndex) in factory.partsRequired"
          :key="`${partIndex}-${part.satisfied}`"
          :style="isSatisfiedStyling(factory, partIndex)"
        >
          <template v-slot:prepend="{ item }">
            <v-icon v-show="part.satisfied" icon="fas fa-check"/>
            <v-icon v-show="!part.satisfied" icon="fas fa-times"/>
          </template>
          <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountNeeded }}
          /min
        </v-list-item>
      </v-list>
    </div>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>
<script setup lang="ts">
import {Factory} from "@/interfaces/planner/Factory";

const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string;

const props = defineProps<{
  factory: Factory;
  helpText: boolean;
}>();

const isSatisfiedStyling = (factory: Factory, requirement: string | number) => {
  return factory.partsRequired[requirement].satisfied ? 'color: green' : 'color: red';
}
</script>
