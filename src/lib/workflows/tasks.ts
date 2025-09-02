import { TopologyNode } from '@deltares/fews-pi-requests'

export function getWorkflowIdsForNode(node: TopologyNode): string[] {
  return [
    node.workflowId,
    node.secondaryWorkflows?.map((wf) => wf.secondaryWorkflowId),
  ]
    .flat()
    .filter((id) => id !== undefined)
    .filter((id, index, self) => id && self.indexOf(id) === index)
}
