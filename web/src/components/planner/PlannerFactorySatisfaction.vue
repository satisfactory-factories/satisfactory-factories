<template>
  <div>
    <h2
      v-show="factory.inputsSatisfied"
      class="text-h5 mb-4"
    >
      <i class="fas fa-check" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="!factory.inputsSatisfied"
      class="text-h5 mb-4"
      style="color: red"
    >
      <i class="fas fa-times" />
      <span class="ml-5">Satisfaction</span>
    </h2>

    <div v-if="Object.keys(factory.partRequirements).length > 0">
      <p v-show="helpText" class="text-body-2 mb-4">
        <i class="fas fa-info-circle" /> All entries are listed as [supply/demand]. Supply is created by adding imports to the factory or adding internal products.
      </p>
      <div
        v-for="(part, partIndex) in factory.partRequirements"
        :key="partIndex"
        class="text-body-1"
        :style="isSatisfiedStyling(factory, partIndex)"
      >
        <p v-if="part.satisfied">
          <v-icon icon="fas fa-check" />
          <span class="ml-2">
            <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min
          </span>
        </p>
        <p v-else>
          <v-icon icon="fas fa-times" />
          <span class="ml-2">
            <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min
          </span>
        </p>
      </div>
    </div>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>
<script setup lang="ts">
  import { Factory } from '@/interfaces/planner/Factory'

  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string

  defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const isSatisfiedStyling = (factory: Factory, requirement: string | number) => {
    return factory.partRequirements[requirement].satisfied ? 'color: green' : 'color: red'
  }
</script>
