import { describe, expect, it } from 'vitest'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import type { ActionResult } from '@deltares/fews-pi-requests'
import { addFilterPeriodToConfig, addIndexToKeys } from '@/lib/display/utils'

describe('addIndexToKeys', () => {
  it('uses a deterministic hash for each request', () => {
    const request = '/timeseries?documentVersion=1'
    const results = [{ requests: [{ request }] }] as ActionResult[]

    addIndexToKeys(results)

    expect(results[0].requests[0].key).toBe(
      bytesToHex(sha256(utf8ToBytes(request))),
    )
  })
})

describe('addFilterPeriodToConfig', () => {
  it('adds the requested period when the grid action config has no period', () => {
    const results = [
      {
        requests: [],
        config: { timeSeriesDisplay: { subplots: [] } },
      },
    ] as ActionResult[]

    addFilterPeriodToConfig(results, {
      layers: 'grid-layer',
      x: 1,
      y: 2,
      bbox: [0, 0, 2, 3],
      startTime: '2026-11-20T00:00:00.000Z',
      endTime: '2026-11-21T00:00:00.000Z',
    })

    expect(results[0].config?.timeSeriesDisplay?.period).toEqual({
      startDate: { date: '2026-11-20', time: '00:00:00' },
      endDate: { date: '2026-11-21', time: '00:00:00' },
    })
  })

  it('preserves a period provided by the backend', () => {
    const period = {
      startDate: { date: '2026-11-01', time: '00:00:00' },
      endDate: { date: '2026-11-10', time: '00:00:00' },
    }
    const results = [
      {
        requests: [],
        config: { timeSeriesDisplay: { period, subplots: [] } },
      },
    ] as ActionResult[]

    addFilterPeriodToConfig(results, {
      layers: 'grid-layer',
      x: 1,
      y: 2,
      bbox: [0, 0, 2, 3],
      startTime: '2026-11-20T00:00:00.000Z',
      endTime: '2026-11-21T00:00:00.000Z',
    })

    expect(results[0].config?.timeSeriesDisplay?.period).toBe(period)
  })

  it('adds the requested period to scalar display configs', () => {
    const results = [
      {
        requests: [],
        config: { scalar1DDisplay: { subplots: [] } },
      },
    ] as ActionResult[]

    addFilterPeriodToConfig(results, {
      layers: 'grid-layer',
      x: 1,
      y: 2,
      bbox: [0, 0, 2, 3],
      startTime: '2026-11-20T00:00:00.000Z',
      endTime: '2026-11-21T00:00:00.000Z',
    })

    expect(results[0].config?.scalar1DDisplay?.period).toEqual({
      startDate: { date: '2026-11-20', time: '00:00:00' },
      endDate: { date: '2026-11-21', time: '00:00:00' },
    })
  })

  it('does not convert invalid filter dates', () => {
    const results = [
      {
        requests: [],
        config: { timeSeriesDisplay: { subplots: [] } },
      },
    ] as ActionResult[]

    expect(() =>
      addFilterPeriodToConfig(results, {
        layers: 'grid-layer',
        x: 1,
        y: 2,
        bbox: [0, 0, 2, 3],
        startTime: 'invalid',
        endTime: 'invalid',
      }),
    ).not.toThrow()
    expect(results[0].config?.timeSeriesDisplay?.period).toBeUndefined()
  })
})
