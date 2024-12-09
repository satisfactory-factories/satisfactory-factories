<template>
  <div class="px-2">
    <h1 class="text-h5 mb-4">
      <i class="fas fa-power-off mr-3" />Power Consumption and Generation
    </h1>
    <p v-show="helpText" class="mb-4">
      <i class="fas fa-info-circle mr-2" />Shows world level power consumption and generation data.
    </p>
    <p class="font-weight-bold mb-4">[Coming soon!!]</p>
    <v-chip
      class="sf-chip yellow"
      variant="tonal"
    >
      <i class="fas fa-bolt mr-2" />[n] MW consumed
    </v-chip>
    <v-chip
      class="sf-chip green"
      variant="tonal"
    >
      <i class="fas fa-solar-panel mr-2" />[n] MW generated
    </v-chip>
  </div>
</template>

  <script setup lang="ts">
  defineProps<{
    helpText: boolean;
  }>()

  </script>
