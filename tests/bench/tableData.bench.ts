import { bench, describe, vi } from 'vitest'
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
} from '@/lib/table/tableData'

// Compares rebuilding the whole table with merging a single loaded page, when
// a page of rows is loaded into a table that already holds many rows.
const pageSize = 1_000
const seriesCount = 5

const chartSeries = Array.from({ length: seriesCount }, (_, index) => {
  const id = `series-${index}`
  return { id, dataResources: [id] }
}) as ChartSeries[]
const seriesIds = chartSeries.map(({ id }) => id)

function createSeriesById(rowCount: number): Record<string, Series> {
  return Object.fromEntries(
    seriesIds.map((id, column) => {
      const series = new Series(new SeriesUrlRequest('benchmark', id))
      series.data = Array.from({ length: rowCount }, (_, row) => ({
        x: new Date(Date.UTC(2025, 0, 1) + row * 60_000),
        y: ((row * 17 + column * 31) % 1_000) / 10,
        flag: '9',
        comment: `Row ${row + 1}, series ${column + 1}`,
      }))
      return [id, series]
    }),
  )
}

for (const rowCount of [10_000, 25_000, 50_000]) {
  describe(`load a page of ${pageSize} rows into ${rowCount - pageSize} rows`, () => {
    const previousSeries = createSeriesById(rowCount - pageSize)
    const previousRows = createTableData(chartSeries, previousSeries, seriesIds)
    const previousLengths = getTableSeriesDataLengths(
      chartSeries,
      previousSeries,
      seriesIds,
    )
    const loadedSeries = createSeriesById(rowCount)

    bench('full rebuild', () => {
      createTableData(chartSeries, loadedSeries, seriesIds)
    })

    bench('incremental page', () => {
      const page = createTableDataPage(
        chartSeries,
        loadedSeries,
        seriesIds,
        previousLengths,
        'after',
      )
      mergeTableData(previousRows, page!.rows)
    })
  })
}
