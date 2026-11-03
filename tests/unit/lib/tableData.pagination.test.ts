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
  const series = new Series(new SeriesUrlRequest('test', id))
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

  it('loads pages incrementally into the same rows as a full rebuild', () => {
    const pageSize = 100
    const rowCount = 2_000
    const allEvents = Object.fromEntries(
      chartSeries.map(({ dataResources: [id] }, column) => [
        id,
        Array.from({ length: rowCount }, (_, row) => ({
          x: date(row),
          y: row + column,
          flag: '9',
          comment: `Row ${row + 1}, series ${column + 1}`,
        })),
      ]),
    )
    const loadedSeries = Object.fromEntries(
      Object.keys(allEvents).map((id) => [id, createSeries(id)]),
    ) as Record<string, Series>
    const loadRows = (count: number) => {
      for (const [id, events] of Object.entries(allEvents)) {
        loadedSeries[id].data = events.slice(0, count)
      }
    }

    loadRows(pageSize)
    let rows: TableData[] = createTableData(
      chartSeries,
      loadedSeries,
      seriesIds,
    )
    let lengths = getTableSeriesDataLengths(
      chartSeries,
      loadedSeries,
      seriesIds,
    )
    for (let count = 2 * pageSize; count <= rowCount; count += pageSize) {
      loadRows(count)
      const page = createTableDataPage(
        chartSeries,
        loadedSeries,
        seriesIds,
        lengths,
        'after',
      )
      expect(page).toBeDefined()
      rows = mergeTableData(rows, page!.rows)
      lengths = page!.seriesDataLengths
    }

    expect(rows).toHaveLength(rowCount)
    expect(rows).toEqual(createTableData(chartSeries, loadedSeries, seriesIds))
  })
})
