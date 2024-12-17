<template>
  <v-overlay
    class="d-flex justify-center align-center"
    :model-value="showLoad"
    opacity="0.7"
    persistent
  >
    <v-card class="pa-4 text-center sub-card" elevation="1" width="500">
      <div class="mb-2 text-h6">Loading Plan...</div>
      <v-progress-linear
        class="my-2"
        color="primary"
        height="8"
        indeterminate
        :max="max"
      />
      <div class="text-subtitle1">Loading {{ max }} factories...</div>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  import eventBus from '@/utils/eventBus'

  const showLoad = ref(false) // Controls the overlay visibility
  const max = ref(0) // Total factories to load

  function handleShowLoading (count: number) {
    console.log('Showing loader')
    showLoad.value = true
    max.value = count
  }

  function handleHideLoading () {
    console.log('Hiding loader')
    showLoad.value = false
  }

  onMounted(() => {
    eventBus.on('showLoading', handleShowLoading)
    eventBus.on('hideLoading', handleHideLoading)
  })

  onUnmounted(() => {
    eventBus.off('showLoading', handleShowLoading)
    eventBus.off('hideLoading', handleHideLoading)
  })
</script>

<style scoped>
.v-card {
  background-color: white;
  border-radius: 8px;
}
</style>
