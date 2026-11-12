import { describe, expect, it } from 'vitest'
import { checkScreenshotLimits } from '@/lib/dynamic-report/screenshotLimits'

describe('checkScreenshotLimits', () => {
  it('accepts images at the exact count and encoded size limits', () => {
    expect(() =>
      checkScreenshotLimits(['abc'], 'def', {
        maxCount: 2,
        maxEncodedBytes: 6,
      }),
    ).not.toThrow()
  })

  it('rejects adding more images than the limit', () => {
    expect(() =>
      checkScreenshotLimits(['abc', 'def'], 'x', {
        maxCount: 2,
        maxEncodedBytes: 100,
      }),
    ).toThrow('cannot contain more than 2 screenshots')
  })

  it('counts encoded UTF-8 bytes and rejects excess size', () => {
    expect(() =>
      checkScreenshotLimits(['ab'], 'é', {
        maxCount: 2,
        maxEncodedBytes: 3,
      }),
    ).toThrow('exceed the 3-byte encoded size limit')
  })

  it('rejects invalid limits', () => {
    expect(() =>
      checkScreenshotLimits([], 'x', { maxCount: 0, maxEncodedBytes: 10 }),
    ).toThrow('Screenshot count limit must be a positive integer')
    expect(() =>
      checkScreenshotLimits([], 'x', { maxCount: 1, maxEncodedBytes: NaN }),
    ).toThrow('Screenshot size limit must be a positive integer')
  })
})
