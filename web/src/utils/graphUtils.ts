import { Factory } from '@/interfaces/planner/FactoryInterface'
import { Edge, MarkerType, Node, Position } from '@vue-flow/core'
import dagre from '@dagrejs/dagre'
import { ref } from 'vue'

export interface CustomData {
  factory: Factory
}

export type CustomNode = Node<CustomData>

const graph = ref(new dagre.graphlib.Graph())
const previousDirection = ref('LR')

const findFactory = (factoryId: string | number, factories: Factory[]): Factory | null => {
  if (!factoryId) {
    console.warn('No factoryId provided to findFactory')
    return null
  }

  // Ensure factoryId is parsed to a number to match factories array ids
  const factory = factories.find(fac => fac.id === parseInt(factoryId.toString(), 10))
  if (!factory) {
    throw new Error(`Factory ${factoryId} not found!`)
  }
  return factory
}

// This function generates the nodes required to render the view
export const generateNodes = (factories: Factory[]): CustomNode[] => {
  const nodes: CustomNode[] = []
  let posX = 50
  let posY = 50

  factories.forEach(factory => {
    nodes.push({
      id: factory.id.toString(),
      position: { x: posX, y: posY },
      type: 'custom',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      connectable: false,
      data: {
        factory,
      },
    })
    posX += 400
    posY += 150
  })

  return nodes
}

export const generateEdges = (factories: Factory[], nodes: CustomNode[]): Edge[] => {
  const edges: Edge[] = []

  nodes.forEach(node => {
    const factory = findFactory(node.id, factories)

    if (!factory) {
      console.log('Cannot find factory data for node', node.id)
      return
    }

    const reqs = factory.dependencies.requests

    Object.keys(reqs).forEach(recFacId => {
      const reqFac = findFactory(recFacId, factories)
      const request = factory.dependencies.requests[recFacId]

      if (!reqFac) {
        console.error('Could not find dependant factory', recFacId)
        return
      }
      console.log(request)
      edges.push({
        id: `${factory.id}->${reqFac.id}`,
        source: factory.id.toString(),
        target: reqFac.id.toString(),
        label: 'Iron plates',
        type: 'smoothstep',
        animated: true,
        markerEnd: MarkerType.ArrowClosed,
      })
    })
  })
  return edges
}

// export const layout = (nodes: CustomNode[], edges: Edge[], direction: string) => {
//   const dagreGraph = new dagre.graphlib.Graph()
//
//   graph.value = dagreGraph
//
//   dagreGraph.setDefaultEdgeLabel(() => ({}))
//
//   const isHorizontal = direction === 'LR'
//   dagreGraph.setGraph({ rankdir: direction })
//
//   previousDirection.value = direction
//
//   for (const node of nodes) {
//     // if you need width+height of nodes for your layout, you can use the dimensions property of the internal node (`GraphNode` type)
//     const graphNode = findNode(node.id)
//
//     dagreGraph.setNode(node.id, { width: graphNode.dimensions.width || 150, height: graphNode.dimensions.height || 50 })
//   }
//
//   for (const edge of edges) {
//     dagreGraph.setEdge(edge.source, edge.target)
//   }
//
//   dagre.layout(dagreGraph)
//
//   // set nodes with updated positions
//   return nodes.map(node => {
//     const nodeWithPosition = dagreGraph.node(node.id)
//
//     return {
//       ...node,
//       targetPosition: isHorizontal ? Position.Left : Position.Top,
//       sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
//       position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
//     }
//   })
// }
