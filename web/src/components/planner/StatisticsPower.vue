<template>
  <div class="px-2">
    <h1 class="text-h5 mb-4">
      <i class="fas fa-power-off mr-3" />Power Consumption and Generation
    </h1>
    <p v-show="helpText" class="mb-4">
      <i class="fas fa-info-circle mr-2" />Shows world level power consumption and generation data.
    </p>
    <v-chip
      class="sf-chip yellow"
      variant="tonal"
    >
      <i class="fas fa-bolt mr-2" />{{ formatNumber(totalPower.totalPowerConsumed) }} MW consumed
    </v-chip>
    <v-chip
      class="sf-chip pink"
      variant="tonal"
    >
      <i class="fas fa-solar-panel mr-2" />{{ formatNumber(totalPower.totalPowerProduced) }} MW generated
    </v-chip>
    <v-chip
      class="sf-chip"
      :class="{
        'green': totalPower.totalPowerDifference > 0,
        'red': totalPower.totalPowerDifference < 0,
      }"
      variant="tonal"
    >
      <i class="fas fa-plug mr-2" />
      {{ formatNumber(totalPower.totalPowerDifference) }} MW difference
    </v-chip>
  </div>
</template>

<script setup lang="ts">
  import {
    Factory,
  } from '@/interfaces/planner/FactoryInterface'
  import { calculateTotalPower } from '@/utils/statistics'
  import { formatNumber } from '@/utils/numberFormatter'

  const props = defineProps<{
    factories: Factory[];
    helpText: boolean;
  }>()

  const totalPower = computed(() => calculateTotalPower(props.factories))
</script>
