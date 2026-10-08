import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import {
  filterSubplotsByParameterIds,
  getParameterIds,
  getParameterIdsQuery,
  parseParameterIds,
} from './parameters'

function series(id: string, parameterId?: string): ChartSeries {
  return {
    id,
    parameterId,
    dataResources: [id],
    name: id,
    type: 'line',
    options: {
      x: { key: 'x', axisIndex: 0 },
      y: { key: 'y', axisIndex: 0 },
    },
    unit: '',
    style: {},
    visibleInLegend: true,
    visibleInPlot: true,
    visibleInTable: true,
  }
}

const subplots: ChartConfig[] = [
  {
    id: 'mixed',
    title: 'Mixed',
    series: [
      series('level-observation', 'level'),
      series('level-forecast', 'level'),
      series('discharge', 'discharge'),
      series('legacy'),
    ],
  },
  {
    id: 'rain',
    title: 'Rain',
    series: [series('rain', 'rain')],
  },
]

test('collects unique parameter IDs and ignores missing metadata', () => {
  expect(getParameterIds(subplots)).toEqual(['level', 'discharge', 'rain'])
})

test('preserves parameter metadata from backend display items', () => {
  const config = timeSeriesDisplayToChartConfig({
    items: [
      {
        type: 'line',
        lineStyle: 'solid',
        request: 'observation',
        parameterId: 'level',
        visibleInLegend: true,
        visibleInPlot: true,
        visibleInTable: true,
      },
    ],
  })
  expect(config.series[0].parameterId).toBe('level')
})

test('without a selection preserves all series, including legacy series', () => {
  expect(filterSubplotsByParameterIds(subplots, undefined)).toBe(subplots)
})

test('filters mixed subplots, keeps all matching forecasts, and removes empty plots', () => {
  const filtered = filterSubplotsByParameterIds(subplots, ['level'])
  expect(filtered).toHaveLength(1)
  expect(filtered[0].series.map((s) => s.id)).toEqual([
    'level-observation',
    'level-forecast',
  ])
  expect(filtered[0].title).toBe('Mixed')
  expect(subplots[0].series).toHaveLength(4)
  expect(subplots).toHaveLength(2)
})

test('empty or unknown selections do not silently show all parameters', () => {
  expect(filterSubplotsByParameterIds(subplots, [])).toEqual([])
  expect(filterSubplotsByParameterIds(subplots, ['unknown'])).toEqual([])
})

describe('share URL parameter selection', () => {
  test('omits the query when all parameters are selected', () => {
    expect(
      getParameterIdsQuery(
        ['rain', 'level', 'discharge'],
        getParameterIds(subplots),
      ),
    ).toBeUndefined()
  })

  test.each([
    { selected: ['level'] },
    { selected: ['level', 'rain'] },
    { selected: ['parameter with spaces', 'id&special,+/'] },
    { selected: [] },
  ])(
    'round-trips selection $selected through a resolved share URL',
    async ({ selected }) => {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/embed/chart', component: { render: () => null } }],
      })
      const available = [...getParameterIds(subplots), ...selected]
      const href = router.resolve({
        path: '/embed/chart',
        query: {
          keep: 'existing',
          parameterIds: getParameterIdsQuery(selected, available),
        },
      }).href
      await router.push(href)
      expect(
        parseParameterIds(router.currentRoute.value.query.parameterIds),
      ).toEqual(selected)
      expect(router.currentRoute.value.query.keep).toBe('existing')
    },
  )

  test('distinguishes missing and explicit empty queries', () => {
    expect(parseParameterIds(undefined)).toBeUndefined()
    expect(parseParameterIds('')).toEqual([])
    expect(parseParameterIds(null)).toEqual([])
    expect(parseParameterIds(['level', null, ''])).toEqual(['level'])
  })
})
