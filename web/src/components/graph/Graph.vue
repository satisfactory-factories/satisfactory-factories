<template>
  <VueFlow :edges="myEdges" :nodes="myNodes">
    <template #node-custom="props">
      <CustomNode v-bind="props" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { Edge, Node } from '@vue-flow/core'
  import { VueFlow } from '@vue-flow/core'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import CustomNode from '@/components/graph/CustomNode.vue'

  const appStore = useAppStore()
  const { factories } = storeToRefs(appStore)

  const findFactory = (factoryId: string | number): Factory | null => {
    if (!factoryId) {
      console.warn('No factoryId provided to findFactory')
      return null
    }

    // Ensure factoryId is parsed to a number to match factories array ids
    const factory = factories.value.find(fac => fac.id === parseInt(factoryId.toString(), 10))
    if (!factory) {
      throw new Error(`Factory ${factoryId} not found!`)
    }
    return factory
  }

  // This function generates the nodes required to render the view
  const generateNodes = (factories: ref<Factory[]>): Node[] => {
    const nodes: Node[] = []
    let posX = 25
    let posY = 25

    factories.value.forEach(factory => {
      nodes.push({
        id: factory.id.toString(),
        position: { x: posX, y: posY },
        type: 'custom',
        data: {
          id: factory.id,
          name: factory.name,
        },
      })
      posX += 200
      posY += 75
    })

    return nodes
  }

  const generateEdges = (factories: Factory[], nodes: Node[]): Edge[] => {
    const edges: Edge[] = []

    nodes.forEach(node => {
      const factory = findFactory(node.id)

      if (!factory) {
        console.log('Cannot find factory data for node', node.id)
        return
      }

      const reqs = factory.dependencies.requests

      Object.keys(reqs).forEach(recFacId => {
        const recFac = findFactory(recFacId)

        if (!recFac) {
          console.error('Could not find dependant factory', recFacId)
          return
        }
        edges.push({
          id: `e${factory.id}->${recFac.id}`,
          source: factory.id.toString(),
          target: recFac.id.toString(),
          type: 'smoothstep',
          animated: false,
          sourceHandle: 'right',
          targetHandle: 'left',
        })
      })
    })
    return edges
  }

  const myNodes = ref<Node[]>(generateNodes(factories))
  const myEdges = ref<Edge[]>(generateEdges(factories, myNodes.value))

  console.log('nodes', myNodes.value)
  console.log('edges', myEdges.value)
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

.vue-flow__node-custom {
    background: purple;
    color: white;
    border: 1px solid purple;
    border-radius: 4px;
    box-shadow: 0 0 0 1px purple;
    padding: 8px;
}
</style>
