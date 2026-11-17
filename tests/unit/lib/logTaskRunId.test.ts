import { describe, expect, it } from 'vitest'
import { cleanTaskRunId } from '@/lib/log/utils'

describe('log task-run IDs', () => {
  it.each([
    ['task-123 -1', 'task-123'],
    ['task with spaces -1', 'task with spaces'],
    ['task with spaces', 'task with spaces'],
    ['task -1 suffix', 'task -1 suffix'],
    ['task -2', 'task -2'],
    ['task-1', 'task-1'],
    ['', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(cleanTaskRunId(input)).toBe(expected)
  })
})
