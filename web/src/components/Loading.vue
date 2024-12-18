<template>
  <v-overlay
    class="d-flex justify-center align-center"
    :model-value="showLoad"
    opacity="1"
    persistent
    @after-enter="afterEnter"
  >
    <v-card class="pa-4 text-center sub-card" width="500">
      <div v-if="max > 0" class="mb-2 text-h5">Loading Plan...</div>
      <div v-else class="mb-2 text-h5">Loading Planner...</div>
      <v-progress-linear
        class="my-2"
        color="primary"
        height="8"
        indeterminate
      />
      <div v-if="max > 0" class="text-h6">Loading {{ max }} factories...</div>
      <div v-if="max > 10" class="text-body-1">This is a fairly large plan and make take some time to load!</div>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  import eventBus from '@/utils/eventBus'

  // We want to show the loader by default cos there's weird chicken and egg scenarios, and the hideLoading event is eventually emitted.
  const showLoad = ref(true)

  const max = ref(0) // Total factories to load

  function handleShowLoading (count: number) {
    console.log('Loader: Showing with factories to load:', count)
    showLoad.value = true
    max.value = count
  }

  function handleHideLoading () {
    console.log('Loader: Hiding')
    showLoad.value = false
  }

  const afterEnter = () => {
    console.log('Loader: Now visible, emitting loadingReady')
    eventBus.emit('loadingReady')
  }

  onMounted(() => {
    eventBus.on('showLoading', handleShowLoading)
    eventBus.on('hideLoading', handleHideLoading)
    console.log('Loader: Ready')
  })

  onUnmounted(() => {
    eventBus.off('showLoading', handleShowLoading)
    eventBus.off('hideLoading', handleHideLoading)
  })
</script>

<style lang="scss" scoped>
.sub-card {
  border-radius: 16px;
  box-shadow: #0094e6 0 0 10px 0;
}

// Overlay styling in global.scss cos it's not a child of this component.
</style>
