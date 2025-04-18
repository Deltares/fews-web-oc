import { TaskRun } from './types'

export function sortTasks(a: TaskRun, b: TaskRun): number {
  const hasDispatchTimeA = a.dispatchTimestamp !== null
  const hasDispatchTimeB = b.dispatchTimestamp !== null
  if (!hasDispatchTimeA && !hasDispatchTimeB) {
    // If both tasks are pending, sort by workflowId.
    return a.workflowId.localeCompare(b.workflowId)
  } else if (!hasDispatchTimeA) {
    // If A is pending and B is not, return A.
    return -1
  } else if (!hasDispatchTimeB) {
    // If B is pending and A is not, return B.
    return 1
  } else {
    // Otherwise, sort by timestamp.
    return b.dispatchTimestamp! - a.dispatchTimestamp!
  }
}
