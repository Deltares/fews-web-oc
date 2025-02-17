import { TopologyNode } from '@deltares/fews-pi-requests'

export function getWorkflowIdsForNode(node: TopologyNode): string[] {
  return [
    // NOTE: For now only consider secondary workflows as this would add
    //       what if panels to older configurations.
    // node.workflowId,
    node.secondaryWorkflows?.map((wf) => wf.secondaryWorkflowId),
  ]
    .flat()
    .filter((id) => id !== undefined)
}
