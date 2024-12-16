<template>
  <div v-if="showAlert" class="count-warning bg-amber w-100 text-center py-1 position-absolute">
    <span v-if="tooManyShownFactories" class="mr-2">Too many factories open! Please hide some factories or your planner will MAJORLY lag!</span>
    <span v-if="tooManyInputs" class="mr-2">Too many imports are being shown, which causes large amounts of lag. Please hide some factories or your planner will MAJORLY lag!</span>
    <v-btn density="compact" @click="emit('hide-all')">Hide all</v-btn>
  </div>
</template>

<script setup lang="ts">
  import { defineEmits } from 'vue'
  import { Factory } from '@/interfaces/planner/FactoryInterface'

  const props = defineProps<{
    factories: Factory[]
  }>()

  const emit = defineEmits<{(event: 'hide-all'): void}>()
  const inputs = computed(() => {
    let count = 0
    props.factories.forEach(factory => {
      if (factory.hidden) return
      count += factory.inputs.length
    })
    return count
  })
  const openFactories = computed(() => {
    let count = 0
    props.factories.forEach(factory => {
      if (!factory.hidden) count++
    })
    return count
  })
  const tooManyInputs = computed(() => inputs.value > 25)
  const tooManyShownFactories = computed(() => openFactories.value > 8)
  const showAlert = computed(() => tooManyInputs.value || tooManyShownFactories.value)

</script>

<style lang="scss">
  .count-warning {
    z-index: 1;
  }
</style>
