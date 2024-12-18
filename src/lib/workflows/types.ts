export interface Workflow {
  workflowId: string
  name: string
  description: string
  expectedRuntimeSeconds: number | null
}

export type WorkflowFormValue = string | number | boolean | Date
export type WorkflowFormData = Record<string, WorkflowFormValue | undefined>
