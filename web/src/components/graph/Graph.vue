<template>
  <h1 class="text-h4 text-center mt-4">Work in progress!</h1>
  <p class="text-center">
    This page is highly experimental and is being actively worked on. It is nowhere near complete.
  </p>
  <Todo />
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
  import { defineProps, ref } from 'vue'
  import { Edge, VueFlow } from '@vue-flow/core'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import FactoryNode from '@/components/graph/FactoryNode.vue'
  import { MiniMap } from '@vue-flow/minimap'
  import { CustomNode, generateEdges, generateNodes } from '@/utils/graphUtils'
  import { DataInterface } from '@/interfaces/DataInterface'
  import { useLayout } from '@/utils/graphLayout'

  import Todo from '@/components/graph/Todo.vue'

  const props = defineProps<{ gameData: DataInterface | null }>()

  if (props.gameData === null) {
    throw new Error('No game data provided to Planner!')
  }

  const appStore = useAppStore()
  const { factories } = storeToRefs(appStore)

  const nodes = ref<CustomNode[]>([])
  const edges = ref<Edge[]>([])

  const { layout } = useLayout()

  // Apply the layout to organize nodes after generation
  function initializeGraph () {
    nodes.value = generateNodes(factories.value)
    edges.value = generateEdges(factories.value, nodes.value)
    const updatedNodes = layout(nodes.value, edges.value, 'LR')
    nodes.value = [...updatedNodes]
  }

  // Apply initial layout when nodes and edges are created
  initializeGraph()

  console.log('nodes', nodes.value)
  console.log('edges', edges.value)
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';
</style>
