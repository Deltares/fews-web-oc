import type { SsdActionResult } from '@deltares/fews-ssd-requests'

interface SelectTopologyNodeEventDetail {
  nodeId?: unknown
}

export function getNodeIdFromSelectTopologyNodeEvent(
  detail: SelectTopologyNodeEventDetail | null | undefined,
): string | undefined {
  const rawNodeId = detail?.nodeId
  if (typeof rawNodeId !== 'string') return undefined

  const nodeId = rawNodeId.trim()
  return nodeId.length > 0 ? nodeId : undefined
}

export function getNodeIdFromSelectTopologyNodeActionResult(
  result: SsdActionResult | null | undefined,
): string | undefined {
  if (result?.type !== 'SELECT_TOPOLOGY_NODE_BY_ID') return undefined

  const request = result.requests?.[0]?.request
  if (typeof request !== 'string') return undefined

  const nodeId = request.trim()
  return nodeId.length > 0 ? nodeId : undefined
}
