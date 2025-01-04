<template>
  <v-overlay
    class="d-flex justify-center align-center"
    data-testid="loading-overlay"
    :model-value="showLoad"
    opacity="1"
    persistent
    @after-enter="afterEnter"
  >
    <v-card class="pa-4 text-center sub-card" width="500">
      <div v-if="toLoad > 0 && !firstLoad" class="mb-2 text-h5">Loading {{ toLoad }} factories...</div>
      <div v-else class="mb-2 text-h5">Loading Planner...</div>
      <v-progress-linear
        class="my-2"
        :color="!isRendering ? 'primary' : 'green'"
        height="8"
        :max="toLoad + 1"
        :model-value="loaded"
      />
      <div v-if="!isRendering" class="mt-2 text-body-1">{{ loaded }} out of {{ toLoad }} loaded...</div>
      <div v-if="isRendering" class="mt-2 text-body-1">Rendering...</div>
      <div class="mt-2 text-body-2 text-grey">{{ calculatingMessage }}</div>
    </v-card>
  </v-overlay>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  import eventBus from '@/utils/eventBus'

  // We want to show the loader by default cos there's weird chicken and egg scenarios, and the hideLoading event is eventually emitted.
  const showLoad = ref(true)

  const toLoad = ref(0) // Total factories to load
  const loaded = ref(0) // Progress bar value
  let firstLoad = true
  const isRendering = ref(false) // Flag to indicate calculation step
  const isLoading = ref(false)

  const calculatingMessages = [
    'Calculating...',
    'Crunching numbers...',
    'Doing the math...',
    'Thinking...',
    'ADA is hard at work...',
    'ADA approves of this message...',
    'FISCIT approves the efficient use of this tool...',
    'Reticulating splines...',
    'Bending the spoon...',
    'The factory must grow...',
    'Powered by cups of tea...',
    'Constructing additional pylons...',
    'We\'ll miss you Snutt!',
    'Sing us your blood song...',
    'Don\'t forget to donate if you\'re enjoying the tool! :)',
  ]
  let calculatingMessage = ''

  const chooseRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * calculatingMessages.length)
    calculatingMessage = calculatingMessages[randomIndex]
  }

  // This is the entrypoint for the loader, where the dialog is told to be shown and when it is shown the load process is kicked off.
  function prepareForLoad (count: number) {
    console.log('Loader: prepareForLoad received. Count to load:', count)

    chooseRandomMessage()
    showLoad.value = true
    toLoad.value = count
    loaded.value = 0
    isRendering.value = false
    isLoading.value = true
    console.log('Loader: State after showLoading', { showLoad: showLoad.value, toLoad: toLoad.value, loaded: loaded.value, isRendering: isRendering.value, isLoading: isLoading.value })
    console.log('Loader: Waiting for v-overlay afterEnter event...')
  }

  function handleHideLoading () {
    console.log('Loader: Hiding')
    showLoad.value = false
    isLoading.value = false
    console.log('Loader: State after hideLoading', { showLoad: showLoad.value, toLoad: toLoad.value, loaded: loaded.value, isRendering: isRendering.value, isLoading: isLoading.value })
  }

  function handleIncrementLoad (payload: { step: string }) {
    // console.log('Loader: Incrementing load', payload)
    loaded.value += 1
    if (payload.step === 'render') {
      console.log('Loader: setting isRendering')
      isRendering.value = true
    }
  }

  const afterEnter = () => {
    console.log('Loader: v-overlay afterEnter received')
    if (firstLoad) {
      firstLoad = false
    }
    eventBus.emit('readyForData')
  }

  const loadingCompleted = () => {
    console.log('Loader: got loadingCompleted')
    isLoading.value = false
  }

  onMounted(() => {
    eventBus.on('prepareForLoad', prepareForLoad)
    eventBus.on('hideLoading', handleHideLoading)
    eventBus.on('incrementLoad', handleIncrementLoad)
    eventBus.on('loadingCompleted', loadingCompleted)
    console.log('Loader: Mounted')
  })

  onUnmounted(() => {
    eventBus.off('prepareForLoad', prepareForLoad)
    eventBus.off('hideLoading', handleHideLoading)
    eventBus.off('incrementLoad', handleIncrementLoad)
    eventBus.off('loadingCompleted', loadingCompleted)
  })
</script>

<style lang="scss" scoped>
.sub-card {
  border-radius: 16px;
  box-shadow: #0094e6 0 0 10px 0;
}

// Overlay styling in global.scss cos it's not a child of this component.
</style>
