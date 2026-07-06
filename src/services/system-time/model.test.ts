import { describe, expect, it } from 'vitest'
import {
  resolveSystemTimeAt,
  type SystemTimeAnchor,
} from './model'

describe('resolveSystemTimeAt', () => {
  it('advances continuously for continuous update pattern', () => {
    const anchor: SystemTimeAnchor = {
      timeBasis: 'actual',
      updatePattern: 'continuous',
      baseSystemTimeMs: 10_000,
      fetchedAtClientMs: 1_000,
    }

    expect(resolveSystemTimeAt(anchor, 1_250).getTime()).toBe(10_250)
  })

  it('advances in discrete steps for step update pattern', () => {
    const anchor: SystemTimeAnchor = {
      timeBasis: 'actual',
      updatePattern: 'step',
      baseSystemTimeMs: 10_000,
      fetchedAtClientMs: 1_000,
      updateIntervalMs: 60_000,
    }

    expect(resolveSystemTimeAt(anchor, 1_500).getTime()).toBe(10_000)
    expect(resolveSystemTimeAt(anchor, 61_000).getTime()).toBe(70_000)
  })

  it('does not move for static update pattern', () => {
    const anchor: SystemTimeAnchor = {
      timeBasis: 'actual',
      updatePattern: 'static',
      baseSystemTimeMs: 42_000,
      fetchedAtClientMs: 1_000,
    }

    expect(resolveSystemTimeAt(anchor, 999_999).getTime()).toBe(42_000)
  })
})
