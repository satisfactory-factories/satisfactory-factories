<template>
  <v-card class="border-md sub-card">
    <v-card-title>
      <h2 class="text-h6">
        <i class="fas fa-cube" /><span class="ml-2">Items</span>
      </h2>
    </v-card-title>
    <v-card-text class="text-body-1 pb-2 px-0">
      <p class="text-body-2 ml-4 mb-4">
        <i class="fas fa-info-circle" />Represented as [Total Supply] - [Total Demand]. Hover over the circles for a breakdown of surplus / demand.
      </p>
      <template v-for="(chunk, _chunkIndex) in satisfactionDisplay" :key="'chunk-' + _chunkIndex">
        <v-row class="border-b-md mx-0">
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
</template>
<script setup lang="ts">
  import PlannerFactorySatisfactionItem from '@/components/planner/PlannerFactorySatisfactionItem.vue'
  import { Factory, PartMetrics } from '@/interfaces/planner/FactoryInterface'

  const props = defineProps<{
    factory: Factory;
  }>()

  // Generate chunks for the satisfaction display
  const satisfactionDisplay = computed<[string, PartMetrics][][]>(() => {
    const parts: [string, PartMetrics][] = Object.entries(props.factory.parts)

    const result: [string, PartMetrics][][] = []
    for (let i = 0; i < parts.length; i += 2) {
      result.push(parts.slice(i, i + 2))
    }
    return result
  })
</script>
