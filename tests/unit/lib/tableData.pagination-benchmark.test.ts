import { describe, expect, it, vi } from 'vitest'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'

const storeMock = vi.hoisted(() => ({ flags: [] }))

vi.mock('@/stores/fewsProperties', () => ({
  useFewsPropertiesStore: () => storeMock,
}))

import {
  createTableData,
  createTableDataPage,
  getTableSeriesDataLengths,
  mergeTableData,
  type TableData,
} from '@/lib/table/tableData'

function createSeries(id: string, data: Series['data'] = []): Series {
  const series = new Series(new SeriesUrlRequest('benchmark', id))
  series.data = data
  return series
}

describe('table-data page helpers', () => {
  const chartSeries = [
    { id: 'first', dataResources: ['first-resource'] },
    { id: 'second', dataResources: ['second-resource'] },
  ] as ChartSeries[]
  const seriesIds = chartSeries.map(({ id }) => id)
  const date = (minute: number) => new Date(Date.UTC(2025, 0, 1, 0, minute))

  it('creates before and after pages and merges overlapping rows', () => {
    const initialSeries = {
      'first-resource': createSeries('first-resource', [{ x: date(2), y: 2 }]),
      'second-resource': createSeries('second-resource', [
        { x: date(2), y: 20 },
      ]),
    }
    const existingRows = createTableData(chartSeries, initialSeries, seriesIds)
    const previousLengths = getTableSeriesDataLengths(
      chartSeries,
      initialSeries,
      seriesIds,
    )
    const beforeSeries = {
      'first-resource': createSeries('first-resource', [
        { x: date(0), y: 0 },
        { x: date(1), y: 1 },
        { x: date(2), y: 2 },
      ]),
      'second-resource': createSeries('second-resource', [
        { x: date(0), y: 10 },
        { x: date(1), y: 11 },
        { x: date(2), y: 20 },
      ]),
    }
    const beforePage = createTableDataPage(
      chartSeries,
      beforeSeries,
      seriesIds,
      previousLengths,
      'before',
    )!
    const mergedBefore = mergeTableData(existingRows, beforePage.rows)

    expect(mergedBefore.map(({ date: rowDate }) => rowDate.getTime())).toEqual(
      [date(0), date(1), date(2)].map((rowDate) => rowDate.getTime()),
    )
    expect(mergedBefore[2].first).toMatchObject({ y: 2 })
    expect(mergedBefore[2].second).toMatchObject({ y: 20 })

    const afterSeries = {
      'first-resource': createSeries('first-resource', [
        { x: date(2), y: 2 },
        { x: date(3), y: 3 },
      ]),
      'second-resource': createSeries('second-resource', [
        { x: date(2), y: 20 },
        { x: date(3), y: 30 },
      ]),
    }
    const afterPage = createTableDataPage(
      chartSeries,
      afterSeries,
      seriesIds,
      previousLengths,
      'after',
    )!
    const mergedAfter = mergeTableData(existingRows, afterPage.rows)

    expect(mergedAfter.map(({ date: rowDate }) => rowDate.getTime())).toEqual(
      [date(2), date(3)].map((rowDate) => rowDate.getTime()),
    )
  })

  it('falls back when a series returns fewer events than before', () => {
    const previousLengths = new Map([
      ['first', 2],
      ['second', 1],
    ])
    const smallerSeries = {
      'first-resource': createSeries('first-resource', [{ x: date(0), y: 0 }]),
      'second-resource': createSeries('second-resource', [
        { x: date(0), y: 0 },
      ]),
    }

    expect(
      createTableDataPage(
        chartSeries,
        smallerSeries,
        seriesIds,
        previousLengths,
        'after',
      ),
    ).toBeUndefined()
  })

  it('falls back when a page contains no additional events', () => {
    const unchangedSeries = {
      'first-resource': createSeries('first-resource', [{ x: date(0), y: 0 }]),
      'second-resource': createSeries('second-resource', [
        { x: date(0), y: 0 },
      ]),
    }
    const previousLengths = new Map([
      ['first', 1],
      ['second', 1],
    ])

    expect(
      createTableDataPage(
        chartSeries,
        unchangedSeries,
        seriesIds,
        previousLengths,
        'after',
      ),
    ).toBeUndefined()
  })
})

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
      seriesIds.map((id) => [id, createSeries(id)]),
    ) as Record<string, Series>
    let seriesDataLengths = new Map<string, number>()
    const cumulativeTimings = new Map<number, number>()
    const incrementalTimings = new Map<number, number>()
    let fullRebuildTotalMs = 0
    let incrementalTotalMs = 0
    let finalRows: ReturnType<typeof createTableData> = []
    let incrementalRows: TableData[] = []

    for (let rowCount = pageSize; rowCount <= 50_000; rowCount += pageSize) {
      for (const id of seriesIds) {
        loadedSeries[id].data = allEvents[id].slice(0, rowCount)
      }

      const startedAt = performance.now()
      finalRows = createTableData(chartSeries, loadedSeries, seriesIds)
      const elapsedMs = performance.now() - startedAt
      fullRebuildTotalMs += elapsedMs

      const incrementalStartedAt = performance.now()
      if (rowCount === pageSize) {
        incrementalRows = createTableData(chartSeries, loadedSeries, seriesIds)
        seriesDataLengths = getTableSeriesDataLengths(
          chartSeries,
          loadedSeries,
          seriesIds,
        )
      } else {
        const page = createTableDataPage(
          chartSeries,
          loadedSeries,
          seriesIds,
          seriesDataLengths,
          'after',
        )
        incrementalRows = mergeTableData(incrementalRows, page!.rows)
        seriesDataLengths = page!.seriesDataLengths
      }
      const incrementalElapsedMs = performance.now() - incrementalStartedAt
      incrementalTotalMs += incrementalElapsedMs

      if (checkpoints.has(rowCount)) {
        cumulativeTimings.set(rowCount, elapsedMs)
        incrementalTimings.set(rowCount, incrementalElapsedMs)
        console.info(
          `[table-data benchmark] ${rowCount} rows: full rebuild ${elapsedMs.toFixed(1)}ms (cumulative ${fullRebuildTotalMs.toFixed(1)}ms), incremental ${incrementalElapsedMs.toFixed(1)}ms (cumulative ${incrementalTotalMs.toFixed(1)}ms)`,
        )
      }
    }

    expect(finalRows).toHaveLength(50_000)
    expect(incrementalRows).toEqual(finalRows)
    expect(cumulativeTimings.size).toBe(checkpoints.size)
    expect(incrementalTimings.size).toBe(checkpoints.size)
  })
})
