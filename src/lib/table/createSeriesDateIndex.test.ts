import { describe, expect, it } from 'vitest'
import { computed, reactive } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import { createSeriesDateIndex } from './createSeriesDateIndex'

describe('createSeriesDateIndex', () => {
  it('indexes dates by series and preserves Date identity', () => {
    const date = new Date('2025-01-01T00:00:00Z')
    const otherDate = new Date('2025-01-02T00:00:00Z')
    const index = createSeriesDateIndex({
      first: {
        data: [
          { x: date, y: 12, flag: '0' },
          { x: date, y: 24, flag: '0' },
        ],
      },
      second: { data: [{ x: otherDate, y: 36, flag: '0' }] },
    })

    expect(index.get('first')?.size).toBe(1)
    expect(index.get('first')?.has(date)).toBe(true)
    expect(index.get('first')?.has(new Date(date.getTime()))).toBe(false)
    expect(index.get('first')?.has(otherDate)).toBe(false)
    expect(index.get('second')?.has(otherDate)).toBe(true)
  })

  it('handles empty, unloaded, and missing series', () => {
    const index = createSeriesDateIndex({
      empty: { data: [] },
      unloaded: {},
    })

    expect(index.get('empty')?.size).toBe(0)
    expect(index.get('unloaded')?.size).toBe(0)
    expect(index.get('missing')).toBeUndefined()
  })

  it('caches the index and refreshes when reactive data changes', () => {
    const date = new Date('2025-01-01T00:00:00Z')
    const otherDate = new Date('2025-01-02T00:00:00Z')
    const series = reactive<Record<string, Pick<Series, 'data'>>>({
      first: { data: [{ x: date, y: 12, flag: '0' }] },
    })
    const index = computed(() => createSeriesDateIndex(series))
    const initialIndex = index.value

    expect(index.value).toBe(initialIndex)
    series.first.data![0].y = 18
    expect(index.value).toBe(initialIndex)

    series.first.data!.push({ x: otherDate, y: 24, flag: '0' })
    expect(index.value).not.toBe(initialIndex)
    expect(index.value.get('first')?.has(otherDate)).toBe(true)

    series.first.data![0].x = otherDate
    expect(index.value.get('first')?.has(date)).toBe(false)

    series.first.data = [{ x: date, y: 36, flag: '0' }]
    expect(index.value.get('first')?.has(date)).toBe(true)
    expect(index.value.get('first')?.has(otherDate)).toBe(false)

    series.first = { data: [{ x: otherDate, y: 48, flag: '0' }] }
    expect(index.value.get('first')?.has(otherDate)).toBe(true)

    delete series.first
    expect(index.value.has('first')).toBe(false)
  })
})
