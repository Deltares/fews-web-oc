import { TaskStatus, TaskStatusCategory } from './types'

interface TaskStatusCategoryDefinition {
  name: string
  category: TaskStatusCategory
  statuses: TaskStatus[]
}
const STATUS_CATEGORIES: TaskStatusCategoryDefinition[] = [
  {
    name: 'Pending',
    category: TaskStatusCategory.Pending,
    statuses: [TaskStatus.Pending],
  },
  {
    name: 'Running',
    category: TaskStatusCategory.Running,
    statuses: [TaskStatus.Running],
  },
  {
    name: 'Completed',
    category: TaskStatusCategory.Completed,
    statuses: [
      TaskStatus.CompletedFullySuccessful,
      TaskStatus.CompletePartlySuccessful,
      TaskStatus.Approved,
      TaskStatus.ApprovedPartlySuccessful,
      TaskStatus.Amalgamated,
      TaskStatus.PartlyCompleted,
    ],
  },
  {
    name: 'Failed',
    category: TaskStatusCategory.Failed,
    statuses: [TaskStatus.Invalid, TaskStatus.Terminated, TaskStatus.Failed],
  },
] as const

export function getAllTaskStatusCategories(): TaskStatusCategory[] {
  return Object.values(TaskStatusCategory)
}

export function getTaskStatusCategoryName(
  category: TaskStatusCategory,
): string {
  const definition = STATUS_CATEGORIES.find(
    (current) => current.category === category,
  )
  if (!definition) {
    throw new Error(`No definition for task status category "${category}".`)
  }
  return definition.name
}

export function getTaskStatusCategory(status: TaskStatus): TaskStatusCategory {
  const definition = STATUS_CATEGORIES.find((current) =>
    current.statuses.includes(status),
  )
  if (!definition) {
    throw new Error(
      `Task status "${status}" is not in any task status category.`,
    )
  }
  return definition.category
}

export function getCompleteTaskStatusCategories(
  statuses: TaskStatus[],
): TaskStatusCategory[] {
  const completeCategories: TaskStatusCategory[] = []
  for (const category of STATUS_CATEGORIES) {
    // If all statuses in this category are in the specified array, the category
    // is defined "complete" and included.
    if (category.statuses.every((status) => statuses.includes(status))) {
      completeCategories.push(category.category)
    }
  }
  return completeCategories
}

export function getTaskStatusesForCategories(
  selectedCategories: TaskStatusCategory[],
): TaskStatus[] {
  const categories = STATUS_CATEGORIES.filter((current) =>
    selectedCategories.includes(current.category),
  )
  return categories.flatMap((category) => category.statuses)
}

export function getIconForTaskStatus(status: TaskStatus): string {
  const category = getTaskStatusCategory(status)
  switch (category) {
    case TaskStatusCategory.Pending:
      return 'mdi-timer-cog'
    case TaskStatusCategory.Running:
      return 'mdi-spin mdi-cog'
    case TaskStatusCategory.Completed:
      return 'mdi-check'
    case TaskStatusCategory.Failed:
      return 'mdi-alert-circle'
  }
}

export function getColorForTaskStatus(status: TaskStatus, isCurrent = true) {
  const category = getTaskStatusCategory(status)
  switch (category) {
    case TaskStatusCategory.Pending:
      return 'info'
    case TaskStatusCategory.Running:
      return 'primary'
    case TaskStatusCategory.Completed:
      if (!isCurrent) return
      return 'success'
    case TaskStatusCategory.Failed:
      return 'error'
  }
}
