import { Factory } from '@/interfaces/planner/FactoryInterface'
import { Edge, MarkerType, Node, Position } from '@vue-flow/core'
import { findFac } from '@/utils/factory-management/factory'
import { getPartDisplayName } from '@/utils/helpers'

export interface CustomData {
  factory: Factory
}

export type CustomNode = Node<CustomData>

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
    const factory = findFac(node.id, factories)

    if (!factory) {
      console.log('Cannot find factory data for node', node.id)
      return
    }

    const reqs = factory.dependencies.requests

    Object.keys(reqs).forEach(recFacId => {
      const reqFac = findFac(recFacId, factories)
      const requests = factory.dependencies.requests[recFacId]

      if (!reqFac) {
        console.error('Could not find dependant factory', recFacId)
        return
      }

      // Loop the requests and get the part name
      for (const request of requests) {
        edges.push({
          id: `${factory.id}->${reqFac.id}`,
          source: factory.id.toString(),
          target: reqFac.id.toString(),
          sourceHandle: `${factory.id}-${request.part}`,
          targetHandle: `${reqFac.id}-${request.part}`,
          label: getPartDisplayName(request.part),
          type: 'smoothstep',
          animated: true,
          markerEnd: MarkerType.ArrowClosed,
        })
      }
    })
  })
  return edges
}
