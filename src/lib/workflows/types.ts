import { Workflow } from '@deltares/fews-pi-requests'

export interface WorkflowItem extends Workflow {
  expectedRuntimeSeconds: number | null
}

export type WorkflowFormValue = string | number | boolean | Date
export type WorkflowFormData = Record<string, WorkflowFormValue | undefined>
