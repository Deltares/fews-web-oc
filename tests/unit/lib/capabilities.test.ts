import type { Layer } from '@deltares/fews-wms-requests'
import { describe, expect, it } from 'vitest'
import {
  getTimesFromCapabilities,
  getValueTimeRangeFromCapabilities,
} from '@/lib/capabilities'

describe('WMS capability value time range', () => {
  it('falls back to the first and last available capability times', () => {
    const capabilities = {
      times: [
        '2026-11-20T00:00:00Z',
        '2026-11-21T00:00:00Z',
        '2026-11-22T00:00:00Z',
      ],
    } as Layer

    expect(getValueTimeRangeFromCapabilities(capabilities)).toEqual([
      new Date('2026-11-20T00:00:00Z'),
      new Date('2026-11-22T00:00:00Z'),
    ])
    expect(getTimesFromCapabilities(capabilities)).toHaveLength(3)
  })

  it('uses explicit value times when available', () => {
    const capabilities = {
      times: [
        '2026-11-20T00:00:00Z',
        '2026-11-21T00:00:00Z',
        '2026-11-22T00:00:00Z',
      ],
      firstValueTime: '2026-11-21T00:00:00Z',
      lastValueTime: '2026-11-21T00:00:00Z',
    } as Layer

    expect(getTimesFromCapabilities(capabilities)).toEqual([
      new Date('2026-11-21T00:00:00Z'),
    ])
  })
})
