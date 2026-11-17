import { describe, expect, it } from 'vitest'
import { resolveSystemTimeAt, type SystemTimeAnchor } from './model'

describe('resolveSystemTimeAt', () => {
  it('advances continuously for continuous update pattern', () => {
    const anchor: SystemTimeAnchor = {
      baseSystemTimeMs: 10_000,
      fetchedAtClientMs: 1_000,
    }

    expect(resolveSystemTimeAt(anchor, 1_250).getTime()).toBe(10_250)
  })
})
