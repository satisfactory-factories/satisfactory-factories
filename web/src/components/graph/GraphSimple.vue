<template>
  <VueFlow
    :key="nodes.length"
    ref="vueFlowRef"
    :edges="edges"
    :nodes="nodes"
    @nodes-initialized="onNodesInitialized"
  >
    <template #node-custom="props">
      <FactoryNodeSimple v-bind="props" @node-rendered="onNodeRendered" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
  import { defineProps, onMounted, ref } from 'vue'
  import { Edge, VueFlow } from '@vue-flow/core'
  import FactoryNodeSimple from '@/components/graph/FactoryNodeSimple.vue'
  import { CustomNode, generateEdges, generateNodes } from '@/utils/graphUtils'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { useAppStore } from '@/stores/app-store'

  const compProps = defineProps<{ gameData: DataInterface | null }>()

  if (compProps.gameData === null) {
    throw new Error('No game data provided to Planner!')
  }

  const appStore = useAppStore()
  const factories = appStore.getFactories()

  const nodes = ref<CustomNode[]>([])
  const edges = ref<Edge[]>([])
  let renderedNodeCount = 0 // Count to track rendered nodes

  const vueFlowRef = ref(null)

  // Apply the layout to organize nodes after generation
  function initializeGraph () {
    nodes.value = generateNodes(appStore.getFactories())
    edges.value = generateEdges(appStore.getFactories(), nodes.value)
  }

  // Handle node rendered and nodesInitialized events
  function onNodeRendered () {
    renderedNodeCount++
    if (renderedNodeCount === nodes.value.length) {
      onNodesInitialized()
    }
  }

  function onNodesInitialized () {
    console.log('Nodes initialized')
    // All nodes have rendered, apply Dagre layout
    const updatedNodes = layout(nodes.value, edges.value, 'LR')
    nodes.value = [...updatedNodes]
    console.log('All nodes rendered, updated with Dagre layout:', nodes.value)
  }

  // Apply initial layout after the component mounts
  onMounted(() => {
    initializeGraph()
    console.log('Initial nodes:', nodes.value)
    console.log('Initial edges:', edges.value)
  })

  watch(factories, () => {
    initializeGraph()
  })
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
