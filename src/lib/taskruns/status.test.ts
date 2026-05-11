import { describe, expect, test } from 'vitest'

import { getExhaustiveTaskStatusCategories } from './status'
import { TaskStatus, TaskStatusCategory } from './types'

describe('getExhaustiveTaskStatusCategories', () => {
  test('returns categories for which all statuses are present', () => {
    const result = getExhaustiveTaskStatusCategories([
      TaskStatus.Pending,
      TaskStatus.Running,
      TaskStatus.CompletedFullySuccessful,
      TaskStatus.Approved,
      TaskStatus.Amalgamated,
      TaskStatus.Invalid,
    ])

    expect(result).toEqual([
      TaskStatusCategory.Pending,
      TaskStatusCategory.Running,
      TaskStatusCategory.Completed,
    ])
  })

  test('does not include categories with only a subset of required statuses', () => {
    const result = getExhaustiveTaskStatusCategories([
      TaskStatus.CompletedFullySuccessful,
      TaskStatus.Approved,
      TaskStatus.CompletePartlySuccessful,
      TaskStatus.ApprovedPartlySuccessful,
    ])

    expect(result).toEqual([])
  })

  test('returns an empty array for empty input', () => {
    const result = getExhaustiveTaskStatusCategories([])

    expect(result).toEqual([])
  })
})
