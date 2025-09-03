import { Workflow } from '@deltares/fews-pi-requests'

export interface WorkflowItem extends Workflow {
  expectedRuntimeSeconds: number | null
}
