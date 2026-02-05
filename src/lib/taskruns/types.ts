export enum TaskStatus {
  Invalid = 'invalid',
  Pending = 'pending',
  Terminated = 'terminated',
  Running = 'running',
  Failed = 'failed',
  CompletedFullySuccessful = 'completed fully successful',
  CompletePartlySuccessful = 'completed partly successful',
  Approved = 'approved',
  ApprovedPartlySuccessful = 'approved partly successful',
  Amalgamated = 'amalgamated',
  PartlyCompleted = 'partly completed',
}

export enum TaskStatusCategory {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface TaskRun {
  taskId: string
  workflowId: string
  fssId: string | null
  status: TaskStatus
  description: string | null
  timeZeroTimestamp: number
  dispatchTimestamp: number | null
  completionTimestamp: number | null
  userId: string | null
  isCurrent: boolean
  outputStartTimestamp: number | null
  outputEndTimestamp: number | null
}

export function isTaskStatus(value: string): value is TaskStatus {
  return Object.values(TaskStatus).includes(value as TaskStatus)
}

export function isTaskRun(value: unknown): value is TaskRun {
  return typeof value === 'object' && value !== null && 'taskId' in value
}
