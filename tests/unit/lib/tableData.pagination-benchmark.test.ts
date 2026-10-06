import { describe, expect, it, vi } from 'vitest'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { Series } from '@/lib/timeseries/timeSeries'

const storeMock = vi.hoisted(() => ({ flags: [] }))

vi.mock('@/stores/fewsProperties', () => ({
  useFewsPropertiesStore: () => storeMock,
}))

import { createTableData } from '@/lib/table/tableData'

describe('table-data repeated page-load benchmark', () => {
  it('measures full rebuilds through 50,000 rows', () => {
    const pageSize = 1_000
    const checkpoints = new Set([10_000, 25_000, 50_000])
    const seriesCount = 5
    const chartSeries = Array.from({ length: seriesCount }, (_, index) => {
      const id = `series-${index}`
      return {
        id,
        dataResources: [id],
      }
    }) as ChartSeries[]
    const seriesIds = chartSeries.map(({ id }) => id)
    const allEvents = Object.fromEntries(
      seriesIds.map((id, column) => [
        id,
        Array.from({ length: 50_000 }, (_, row) => ({
          x: new Date(Date.UTC(2025, 0, 1) + row * 60_000),
          y: ((row * 17 + column * 31) % 1_000) / 10,
          flag: '9',
          comment: `Row ${row + 1}, series ${column + 1}`,
        })),
      ]),
    )
    const loadedSeries = Object.fromEntries(
      seriesIds.map((id) => [id, { data: [] }]),
    ) as unknown as Record<string, Series>
    const cumulativeTimings = new Map<number, number>()
    let cumulativeMs = 0
    let finalRows: ReturnType<typeof createTableData> = []

    for (let rowCount = pageSize; rowCount <= 50_000; rowCount += pageSize) {
      for (const id of seriesIds) {
        loadedSeries[id].data = allEvents[id].slice(0, rowCount)
      }

      const startedAt = performance.now()
      finalRows = createTableData(chartSeries, loadedSeries, seriesIds)
      const elapsedMs = performance.now() - startedAt
      cumulativeMs += elapsedMs

      if (checkpoints.has(rowCount)) {
        cumulativeTimings.set(rowCount, elapsedMs)
        console.info(
          `[table-data benchmark] ${rowCount} rows: rebuild ${elapsedMs.toFixed(1)}ms, repeated rebuild total ${cumulativeMs.toFixed(1)}ms`,
        )
      }
    }

    expect(finalRows).toHaveLength(50_000)
    expect(cumulativeTimings.size).toBe(checkpoints.size)
  })
})
