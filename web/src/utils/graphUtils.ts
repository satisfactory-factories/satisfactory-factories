import { Factory } from '@/interfaces/planner/FactoryInterface'
import { Edge, MarkerType, Node, Position } from '@vue-flow/core'

export interface CustomData {
  factory: Factory
}

export type CustomNode = Node<CustomData>

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
