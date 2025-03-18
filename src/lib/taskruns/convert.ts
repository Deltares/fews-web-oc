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
    // FIXME: is "user" as userId or a user name? Also, it can be null for
    //        scheduled tasks, but this is undocumented.
    userId: taskRun.user,
    status: convertToTaskStatus(taskRun.status),
    description,
    timeZeroTimestamp,
    dispatchTimestamp,
    completionTimestamp,
    isScheduled: taskRun.user === null,
    outputStartTimestamp,
    outputEndTimestamp,
  }
}

export function convertToTaskStatus(status: string): TaskStatus {
  switch (status) {
    case 'invalid':
      return TaskStatus.Invalid
    case 'pending':
      return TaskStatus.Pending
    case 'terminated':
      return TaskStatus.Terminated
    case 'running':
      return TaskStatus.Running
    case 'failed':
      return TaskStatus.Failed
    case 'completed fully successful':
      return TaskStatus.CompletedFullySuccessful
    case 'completed partly successful':
      return TaskStatus.CompletePartlySuccessful
    case 'approved':
      return TaskStatus.Approved
    case 'approved partly successful':
      return TaskStatus.ApprovedPartlySuccessful
    case 'amalgamated':
      return TaskStatus.Amalgamated
    case 'partly completed':
      return TaskStatus.PartlyCompleted
    default:
      throw new Error(`Invalid task status: "${status}".`)
  }
}

export function convertTaskStatusToString(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Invalid:
      return 'Invalid'
    case TaskStatus.Pending:
      return 'Pending'
    case TaskStatus.Terminated:
      return 'Terminated'
    case TaskStatus.Running:
      return 'Running'
    case TaskStatus.Failed:
      return 'Failed'
    case TaskStatus.CompletedFullySuccessful:
      return 'Completed fully successful'
    case TaskStatus.CompletePartlySuccessful:
      return 'Completed partly successful'
    case TaskStatus.Approved:
      return 'Approved'
    case TaskStatus.ApprovedPartlySuccessful:
      return 'Approved partly successful'
    case TaskStatus.Amalgamated:
      return 'Amalgamated'
    case TaskStatus.PartlyCompleted:
      return 'Partly completed'
  }
}
