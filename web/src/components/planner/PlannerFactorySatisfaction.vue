<template>
  <div>
    <h2
      v-show="factory.requirementsSatisfied && Object.keys(factory.parts).length > 0"
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
      v-show="factory.requirementsSatisfied && Object.keys(factory.parts).length === 0"
      class="text-h5 mb-4"
    >
      <i class="fas fa-question" />
      <span class="ml-3">Satisfaction</span>
    </h2>

    <v-row v-if="Object.keys(factory.parts).length > 0">
      <v-col cols="12" md="7">
        <v-card class="border-md sub-card">
          <v-card-title>
            <h2 class="text-h6">
              <i class="fas fa-cube" /><span class="ml-2">Items</span>
            </h2>
          </v-card-title>
          <v-card-text class="text-body-1 pb-2 pt-2">
            <p v-show="helpText" class="text-body-2 mb-4">
              <i class="fas fa-info-circle" /> Listed as [supply/demand]. Supply is created by adding imports to the factory or producing the product internally.
            </p>
            <template v-for="(chunk, chunkIndex) in chunkedSatisfactionDisplay" :key="chunkIndex">
              <v-row class="border-b-md">
                <template v-for="([partId, part], index) in chunk" :key="partId">
                  <v-col
                    cols="12"
                    md="6"
                    class="pa-0"
                    :class="index === 0 ? 'border-e-md' : ''"
                  >
                    <planner-factory-satisfaction-item
                      :classes="isSatisfiedStyling(part)"
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
              :key="buildingIndex"
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

  // Function to chunk the satisfactionDisplay into groups of two
  const chunkArray = <T>(array: [string, T][], chunkSize: number): [string, T][][] => {
    const result: [string, T][][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  // Calculated function showing parts displayed if the amountRequired > 0
  const satisfactionDisplay = computed(() => {
    return Object.entries(props.factory.parts)
      .filter(([_, value]) => value.amountRequired > 0);
  });

  // Chunked satisfaction display for rows
  const chunkedSatisfactionDisplay = computed(() => {
    return chunkArray(satisfactionDisplay.value, 2);
  });

  const isSatisfiedStyling = (part: PartMetrics) => {
    return {
      'text-green': part.satisfied,
      'text-red': !part.satisfied,
    }
  }

</script>
