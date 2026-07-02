import { describe, expect, it } from 'vitest'
import {
  resolveSystemTimeAt,
  type SystemTimeAnchor,
} from './model'

describe('resolveSystemTimeAt', () => {
  it('advances continuously for running mode', () => {
    const anchor: SystemTimeAnchor = {
      mode: 'running',
      baseSystemTimeMs: 10_000,
      fetchedAtClientMs: 1_000,
    }

    expect(resolveSystemTimeAt(anchor, 1_250).getTime()).toBe(10_250)
  })

  it('advances in discrete steps for fixed interval mode', () => {
    const anchor: SystemTimeAnchor = {
      mode: 'running_fixed_interval',
      baseSystemTimeMs: 10_000,
      fetchedAtClientMs: 1_000,
      updateIntervalMs: 60_000,
    }

    expect(resolveSystemTimeAt(anchor, 1_500).getTime()).toBe(10_000)
    expect(resolveSystemTimeAt(anchor, 61_000).getTime()).toBe(70_000)
  })

  it('does not move for static mode', () => {
    const anchor: SystemTimeAnchor = {
      mode: 'static',
      baseSystemTimeMs: 42_000,
      fetchedAtClientMs: 1_000,
    }

    expect(resolveSystemTimeAt(anchor, 999_999).getTime()).toBe(42_000)
  })
})
