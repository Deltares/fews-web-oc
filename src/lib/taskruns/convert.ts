import { TaskRun as FewsPiTaskRun } from '@deltares/fews-pi-requests'

import { TaskRun, TaskStatus } from './types'

export function convertFewsPiTaskRunToTaskRun(taskRun: FewsPiTaskRun): TaskRun {
  const timeZeroTimestamp = new Date(taskRun.time0).getTime()
  const dispatchTimestamp = taskRun.dispatchTime
    ? new Date(taskRun.dispatchTime).getTime()
    : null
  const completionTimestamp = taskRun.completionTime
    ? new Date(taskRun.completionTime).getTime()
    : null
  const outputStartTimestamp = taskRun.outputStartTime
    ? new Date(taskRun.outputStartTime).getTime()
    : null
  const outputEndTimestamp = taskRun.outputEndTime
    ? new Date(taskRun.outputEndTime).getTime()
    : null
  // Set null for undefined and empty descriptions.
  const description = taskRun.description ? taskRun.description : null
  return {
    taskId: taskRun.id,
    workflowId: taskRun.workflowId,
    userId: taskRun.user,
    fssId: taskRun.fssId ?? null,
    status: convertToTaskStatus(taskRun.status),
    description,
    timeZeroTimestamp,
    dispatchTimestamp,
    completionTimestamp,
    isCurrent: taskRun.current,
    outputStartTimestamp,
    outputEndTimestamp,
  }
}

export function convertToTaskStatus(status: string): TaskStatus {
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus
  }
  throw new Error(`Invalid task status: "${status}".`)
}

export function convertTaskStatusToString(status: TaskStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
