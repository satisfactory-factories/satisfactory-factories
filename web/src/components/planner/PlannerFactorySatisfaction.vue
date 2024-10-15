<template>
  <div>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.partRequirements).length > 0"
      class="text-h5 mb-4"
    >
      <i class="fas fa-check" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="!factory.requirementsSatisfied"
      class="text-h4 mb-4 text-red"
    >
      <i class="fas fa-times" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.partRequirements).length === 0"
      class="text-h5 mb-4"
    >
      <i class="fas fa-question" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <v-row v-if="Object.keys(factory.partRequirements).length > 0">
      <v-col>
        <v-card class="my-card mb-1 border-md">
          <v-card-title>
            <h2 class="text-h6"><i class="fas fa-cube" /><span class="ml-2">Items</span></h2>
          </v-card-title>
          <v-card-text class="text-body-1">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle" /> Listed as [supply/demand]. Supply is created by adding imports to the factory or producing the product internally.
            </p>
            <div
              v-for="(part, partIndex) in factory.partRequirements"
              :key="partIndex"
              :class="isSatisfiedStyling(factory, partIndex)"
            >
              <p v-if="part.satisfied">
                <v-icon icon="fas fa-check" />
                <span class="ml-2"><b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min</span>
              </p>
              <p v-else>
                <v-icon icon="fas fa-times" />
                <span class="ml-2">
                  <span>
                    <b>{{ getPartDisplayName(partIndex) }}</b>: {{ part.amountSupplied }}/{{ part.amountRequired }} /min
                  </span>
                  <v-btn
                    v-if="getImport(factory, partIndex)"
                    class="ml-2"
                    color="primary"
                    size="small"
                    variant="outlined"
                    @click="fixSatisfactionImport(factory, partIndex)"
                  >Fix Import</v-btn>
                </span>
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card class="my-card border-md">
          <v-card-title>
            <h2 class="text-h6">
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
      </v-col>
    </v-row>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>
<script setup lang="ts">
  import { Factory, FactoryImport } from '@/interfaces/planner/FactoryInterface'

  const getPartDisplayName = inject('getPartDisplayName') as (part: string) => string
  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string
  const updateFactory = inject('updateFactory') as (part: string) => string

  defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const isSatisfiedStyling = (factory: Factory, requirement: string | number) => {
    return {
      'text-green': factory.partRequirements[requirement].satisfied,
      'text-red': !factory.partRequirements[requirement].satisfied,
    }
  }

  const getImport = (factory, partIndex: string): FactoryImport => {
    // Search the inputs array for the outputPart using the part index
    return factory.inputs.find(input => input.outputPart === partIndex)
  }

  const fixSatisfactionImport = (factory: Factory, partIndex: string | number) => {
    const itemImport = getImport(factory, partIndex)

    // If the import is not found, return
    if (!itemImport) return

    // Set the import amount to the required amount
    itemImport.amount = factory.partRequirements[partIndex].amountRequired
    updateFactory(factory)
  }
</script>
