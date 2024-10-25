<script setup lang="ts">
  import type { NodeProps } from '@vue-flow/core'
  import { Handle } from '@vue-flow/core'
  import { CustomData, CustomEvents } from '@/components/graph/Graph.vue'

  // props were passed from the slot using `v-bind="customNodeProps"`
  const props = defineProps<NodeProps<CustomData, CustomEvents>>()

</script>

<template>
  <div class="node">
    <Handle :position="props.targetPosition" type="target" />
    <div>{{ data.hello }}</div>
    <Handle :position="props.sourcePosition" type="source" />
  </div>
</template>

<style lang="scss" scoped>

.node {
  position: relative;
  width: 200px;
  height: 50px;
  background: purple;
  color: white;
  border: 1px solid purple;
  border-radius: 4px;
  box-shadow: 0 0 0 1px purple;
  padding: 8px;
}

</style>
