<template>
  <div>
    <h2
      v-show="factory.requirementsSatisfied && hasParts"
      class="text-h5 mb-4"
    >
      <i class="fas fa-check" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="!factory.requirementsSatisfied"
      class="text-h5 mb-4 text-red"
    >
      <i class="fas fa-times" />
      <span class="ml-3">Satisfaction</span>
    </h2>
    <h2
      v-show="factory.requirementsSatisfied && !hasParts"
      class="text-h5 mb-4"
    >
      <i class="fas fa-question" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <v-row v-if="hasParts">
      <v-col cols="12" md="7">
        <v-card class="border-md sub-card">
          <v-card-title>
            <h2 class="text-h6">
              <i class="fas fa-cube" /><span class="ml-2">Items</span>
            </h2>
          </v-card-title>
          <v-card-text class="text-body-1 pb-2 px-0">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle" /> Listed as [supply/demand]. Supply is created by adding imports to the factory or producing the product internally.
            </p>
            <template v-for="(chunk, _chunkIndex) in satisfactionDisplay" :key="'chunk-' + _chunkIndex">              <v-row class="border-b-md mx-0">
              <template v-for="([partId, part], index) in chunk" :key="partId">
                <v-col
                  class="pa-0 align-content-center"
                  :class="index === 0 ? 'border-e-md' : ''"
                  cols="12"
                  md="6"
                >
                  <planner-factory-satisfaction-item
                    :factory="factory"
                    :part="part"
                    :part-id="partId"
                  />
                </v-col>
              </template>
            </v-row>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="sub-card border-md">
          <v-card-title>
            <h2 class="text-h6">
              <i class="fas fa-building" />
              <span class="ml-3">Factory Buildings</span>
            </h2>
          </v-card-title>
          <v-card-text class="text-body-1 pb-2">
            <div
              v-for="([, buildingData], buildingIndex) in Object.entries(factory.buildingRequirements)"
              :key="'building-' + buildingIndex"
              style="display: inline;"
            >
              <v-chip
                class="sf-chip orange"
                variant="tonal"
              >
                <game-asset
                  :subject="buildingData.name"
                  type="building"
                />
                <span class="ml-2">
                  <b>{{ getBuildingDisplayName(buildingData.name) ?? 'UNKNOWN' }}</b>: {{ formatNumber(buildingData.amount) ?? 0 }}x
                </span>
              </v-chip>
            </div>
            <v-divider class="my-2" color="#ccc" thickness="2px" />
            <div>
              <h2 class="text-h6">
                <i class="fas fa-plug" />
                <span class="ml-3">Factory Power</span>
              </h2>
              <v-chip
                class="sf-chip yellow"
                variant="tonal"
              >
                <i class="fas fa-bolt" />
                <span class="ml-2">
                  {{ formatNumber(factory.totalPower) }} MW
                </span>
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <p v-else class="text-body-1">Awaiting product selection or requirements outside of Raw Resources.</p>
  </div>
</template>

<script setup lang="ts">
  import {
    Factory,
    PartMetrics,
  } from '@/interfaces/planner/FactoryInterface'
  import { computed, inject } from 'vue'

  import { formatNumber } from '@/utils/numberFormatter'
  import PlannerFactorySatisfactionItem from '@/components/planner/PlannerFactorySatisfactionItem.vue'

  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  // Reactive factory parts check
  const hasParts = computed(() => Object.keys(props.factory.parts).length > 0)

  // Function to chunk the satisfactionDisplay into groups of two
  const chunkArray = function <T> (array: [string, T][], chunkSize: number): [string, T][][] {
    const result: [string, T][][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize))
    }
    return result
  }

  // Generate chunks for the satisfaction display
  // @eslint-disable-next-line
  const satisfactionDisplay = computed<[string, PartMetrics][][]>(() => {
    console.log('chunkedSatisfactionDisplay recomputed')
    const filteredParts = Object.entries(props.factory.parts).filter(
      ([, value]) => value.amountRequired > 0
    )
    return chunkArray(filteredParts, 2)
  })
</script>
