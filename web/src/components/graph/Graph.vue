<template>
  <VueFlow
    :key="nodes.length"
    :edges="edges"
    :nodes="nodes"
  >
    <MiniMap />
    <template #node-custom="props">
      <!--suppress RequiredAttributes -->
      <FactoryNode v-bind="props" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  import { Edge, Node, VueFlow } from '@vue-flow/core'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import FactoryNode from '@/components/graph/FactoryNode.vue'
  import { MiniMap } from '@vue-flow/minimap'
  import { generateEdges, generateNodes } from '@/utils/graphUtils'

  export interface CustomData {
    hello: string
  }

  export interface CustomEvents {
    onCustomEvent: (event: MouseEvent) => void
  }

  type CustomNodeTypes = 'custom'

  type CustomNode = Node<CustomData, CustomEvents, CustomNodeTypes>

  const appStore = useAppStore()
  const { factories } = storeToRefs(appStore)

  const nodes = ref<CustomNode[]>(generateNodes(factories))
  const edges = ref<Edge[]>(generateEdges(factories, nodes.value))

  console.log('nodes', nodes.value)
  console.log('edges', edges.value)
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
