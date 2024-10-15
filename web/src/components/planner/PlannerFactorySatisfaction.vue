<template>
  <div>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.partRequirements).length > 0"
      class="text-h4 mb-4"
    >
      <i class="fas fa-check" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="!factory.requirementsSatisfied"
      class="text-h4 mb-4"
      style="color: red"
    >
      <i class="fas fa-times" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.partRequirements).length === 0"
      class="text-h4 mb-4"
    >
      <i class="fas fa-question" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <div v-if="Object.keys(factory.partRequirements).length > 0">
      <v-card class="my-card mb-1 border-md">
        <v-card-title>
          <h2 class="text-h5"><i class="fas fa-cube" /><span class="ml-2">Items</span></h2>
        </v-card-title>
        <v-card-text class="text-body-1">
          <p v-show="helpText" class="text-body-2 mb-4">
            <i class="fas fa-info-circle" /> All entries are listed as [supply/demand]. Supply is created by adding imports to the factory or adding internal products.
          </p>
          <div
            v-for="(part, partIndex) in factory.partRequirements"
            :key="partIndex"
            :style="isSatisfiedStyling(factory, partIndex)"
          >
            <p v-if="part.satisfied">
              <v-icon icon="fas fa-check" />
              <span class="ml-2"><b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min</span>
            </p>
            <p v-else>
              <v-icon icon="fas fa-times" />
              <span class="ml-2"><b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min</span>
            </p>
          </div>
        </v-card-text>
      </v-card>
      <v-card class="my-card border-md">
        <v-card-title>
          <h2 class="text-h5">
            <i class="fas fa-building" />
            <span class="ml-3">Buildings</span>
          </h2>
        </v-card-title>
        <v-card-text class="text-body-1">
          <p class="mb-4 text-yellow-darken-3">
            <v-icon icon="fas fa-bolt" />
            <span class="ml-2"><b>Power</b>: {{ factory.totalPower.toFixed(2) }} MW</span>
          </p>
          <div>
            <p v-if="factory.buildingRequirements.length === 0">No buildings required.</p>
            <div v-else>
              <p
                v-for="(building, buildingIndex) in factory.buildingRequirements"
                :key="buildingIndex"
                class="mb-1"
              >
                <v-icon icon="fas fa-building" />
                <span class="ml-2"><b>{{ getBuildingDisplayName(building.name) }}</b>: {{ building.amount }}x</span>
              </p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>
<script setup lang="ts">
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string

  defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const isSatisfiedStyling = (factory: Factory, requirement: string | number) => {
    return factory.partRequirements[requirement].satisfied ? 'color: green' : 'color: red'
  }
</script>
