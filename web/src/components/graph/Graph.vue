<template>
  <VueFlow
    :key="nodes.length"
    :edges="edges"
    :node-types="nodeTypes"
    :nodes="nodes"
  >
    <MiniMap />
    <template #node-custom="props">
      <CustomNodeComponent v-bind="props" />
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
  import { markRaw, ref } from 'vue'

  import { Edge, MarkerType, Node, Position, useVueFlow, VueFlow } from '@vue-flow/core'
  import { useAppStore } from '@/stores/app-store'
  import { storeToRefs } from 'pinia'
  import { Factory } from '@/interfaces/planner/FactoryInterface'
  import CustomNodeComponent from '@/components/graph/CustomNodeComponent.vue'
  import { MiniMap } from '@vue-flow/minimap'

  export interface CustomData {
    hello: string
  }

  export interface CustomEvents {
    onCustomEvent: (event: MouseEvent) => void
  }

  type CustomNodeTypes = 'custom'

  type CustomNode = Node<CustomData, CustomEvents, CustomNodeTypes>

  const nodeTypes = ref({
    custom: markRaw(CustomNodeComponent),
  })

  const { onConnect } = useVueFlow()

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
  const generateNodes = (factories: ref<Factory[]>): CustomNode[] => {
    const nodes: CustomNode[] = []
    let posX = 25
    let posY = 25

    factories.value.forEach(factory => {
      nodes.push({
        id: factory.id.toString(),
        position: { x: posX, y: posY },
        type: 'custom',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        connectable: false,
        data: {
          id: factory.id,
          label: `${factory.name} (${factory.id})`,
          hello: 'world',
        },
      })
      posX += 200
      posY += 75
    })

    return nodes
  }

  const generateEdges = (factories: Factory[], nodes: NodeData[]): Edge[] => {
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
          id: `${factory.id}->${recFac.id}`,
          source: factory.id.toString(),
          target: recFac.id.toString(),
          label: 'Iron plates',
          type: 'smoothstep',
          animated: false,
          markerEnd: MarkerType.ArrowClosed,
        })
      })
    })
    return edges
  }

  const nodes = ref<CustomNode[]>(generateNodes(factories))
  const edges = ref<Edge[]>(generateEdges(factories, nodes.value))

  console.log('nodes', nodes.value)
  console.log('edges', edges.value)

  onConnect(({ source, target, sourceHandle, targetHandle }) => {
    console.log('source', source)
    console.log('target', target)
    // these are the handle ids of the source and target node
    // if no id is specified these will be `null`, meaning the first handle of the necessary type will be used
    console.log('sourceHandle', sourceHandle)
    console.log('targetHandle', targetHandle)
  })
</script>

<style>
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

</style>
