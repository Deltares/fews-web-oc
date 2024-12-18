export interface Workflow {
  workflowId: string
  name: string
  description: string
  expectedRuntimeSeconds: number | null
}
