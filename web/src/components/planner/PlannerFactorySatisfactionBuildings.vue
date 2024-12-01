<template>
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
</template>
<script setup lang="ts">
  import { formatNumber } from '@/utils/numberFormatter'
  import { inject } from 'vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const props = defineProps<{
    factory: Factory;
    helpText: boolean;
  }>()

  const getBuildingDisplayName = inject('getBuildingDisplayName') as (part: string) => string

</script>
