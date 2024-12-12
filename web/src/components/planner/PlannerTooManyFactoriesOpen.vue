<template>
  <div v-if="count > 5" class="count-warning bg-amber w-100 text-center py-1 position-absolute">
    <span class="mr-2">Too many factories open! Please hide some factories or your planner will MAJORLY lag!</span>
    <v-btn density="compact" @click="emit('hide-all')">Hide all</v-btn>
  </div>
</template>

<script setup lang="ts">
  import { defineEmits } from 'vue'

  defineProps<{
    count: number;
  }>()

  const emit = defineEmits<{(event: 'hide-all'): void}>()
</script>

<style lang="scss">
  .count-warning {
    z-index: 1;
  }
</style>
