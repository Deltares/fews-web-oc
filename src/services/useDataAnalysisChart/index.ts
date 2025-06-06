import { Chart } from '@/lib/analysis'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { computed, MaybeRefOrGetter, toValue } from 'vue'
import { useCorrelation } from '../useCorrelation'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { convertJSDateToFewsPiParameter } from '@/lib/date'

type ChartData = {
  subplot: MaybeRefOrGetter<TimeSeriesDisplaySubplot>
  derivedSeries: MaybeRefOrGetter<Record<string, Series>>
}

export function useDataAnalysisChart(
  chart: MaybeRefOrGetter<Chart>,
  series: MaybeRefOrGetter<Record<string, Series>>,
  startTime: MaybeRefOrGetter<Date>,
  endTime: MaybeRefOrGetter<Date>,
) {
  function getChartData(
    chart: MaybeRefOrGetter<Chart>,
    series: MaybeRefOrGetter<Record<string, Series>>,
    startTime: MaybeRefOrGetter<Date>,
    endTime: MaybeRefOrGetter<Date>,
  ) {
    // NOTE: This assumes that the chart type does not change after the initial load.
    const _chart = toValue(chart)
    switch (_chart.type) {
      case 'filter':
        return useFilterChartData(chart, series, startTime, endTime)
      case 'derived':
        return useDerivedChartData(chart, series, startTime, endTime)
      case 'correlation':
        return useCorrelationChartData(chart, series, startTime, endTime)
    }
  }

  const { subplot: newSubplot, derivedSeries: newDerivedSeries } = getChartData(
    chart,
    series,
    startTime,
    endTime,
  )

  const combinedSeries = computed(() => {
    const originalSeries = toValue(series)
    const derivedSeries = toValue(newDerivedSeries)
    return {
      ...originalSeries,
      ...derivedSeries,
    }
  })

  const subplot = computed(() => toValue(newSubplot))

  return {
    subplot,
    series: combinedSeries,
  }
}

function useFilterChartData(
  chart: MaybeRefOrGetter<Chart>,
  _series: MaybeRefOrGetter<Record<string, Series>>,
  _startTime: MaybeRefOrGetter<Date>,
  _endTime: MaybeRefOrGetter<Date>,
): ChartData {
  return {
    subplot: () => toValue(chart).subplot,
    derivedSeries: {},
  }
}

function useDerivedChartData(
  chart: MaybeRefOrGetter<Chart>,
  _series: MaybeRefOrGetter<Record<string, Series>>,
  _startTime: MaybeRefOrGetter<Date>,
  _endTime: MaybeRefOrGetter<Date>,
): ChartData {
  return {
    subplot: () => toValue(chart).subplot,
    derivedSeries: {},
  }
}

function useCorrelationChartData(
  _chart: MaybeRefOrGetter<Chart>,
  _series: MaybeRefOrGetter<Record<string, Series>>,
  startTime: MaybeRefOrGetter<Date>,
  endTime: MaybeRefOrGetter<Date>,
): ChartData {
  const chart = computed(() => {
    const newChart = toValue(_chart)
    if (newChart.type !== 'correlation') {
      throw new Error('Chart is not a correlation chart')
    }
    return newChart
  })

  const filter = computed(() => ({
    ...chart.value.filter,
    startTime: convertJSDateToFewsPiParameter(toValue(startTime)),
    endTime: convertJSDateToFewsPiParameter(toValue(endTime)),
  }))

  const { correlation } = useCorrelation(filter)

  function getSubplot(
    yAxisName: string,
    xAxisName: string,
    lineId: string,
    pointsId: string,
    legend: string,
  ) {
    const baseItem = {
      visibleInPlot: true,
      visibleInTable: true,
      yAxis: {
        axisPosition: 'left',
        axisLabel: yAxisName,
      },
    }

    const line: TimeSeriesDisplaySubplotItem = {
      ...baseItem,
      type: 'line',
      legend,
      color: '#080c80',
      lineStyle: 'solid;thick',
      lineWidth: 1.0,
      request: lineId,
      visibleInLegend: true,
    }

    const points: TimeSeriesDisplaySubplotItem = {
      ...baseItem,
      type: 'line',
      color: '#ff0000',
      markerStyle: 'solid',
      markerSize: 6,
      request: pointsId,
      visibleInLegend: false,
    }

    const subplot: TimeSeriesDisplaySubplot = {
      xAxis: {
        axisLabel: xAxisName,
      },
      items: [line, points],
    }

    return subplot
  }

  const lineId = 'correlation-line'
  const pointsId = 'correlation-points'

  const subplot = computed(() => {
    const description = correlation.value?.equation?.description
    const rSquared = correlation.value?.equation?.['R-squared']
    const legend = `${description} with r²=${rSquared?.toFixed(3)}`
    return getSubplot(
      chart.value.timeSeriesNameXAxis,
      chart.value.timeSeriesNameYAxis,
      lineId,
      pointsId,
      legend,
    )
  })

  const derivedSeries = computed(() => {
    const arr1 = correlation.value?.fitPoints // x, y
    const arr2 = correlation.value?.values // time, x, y

    const newSeriesLine = new Series({
      type: SeriesResourceType.Derived,
    })
    newSeriesLine.lastUpdated = new Date()
    newSeriesLine.data =
      arr1?.map((point) => ({
        x: point.x,
        y: point.y,
        flag: '0',
      })) ?? []

    const newSeriesPoints = new Series({
      type: SeriesResourceType.Derived,
    })
    newSeriesPoints.lastUpdated = new Date()
    newSeriesPoints.data =
      arr2?.map((point) => ({
        x: point.x,
        y: point.y,
        flag: '0',
      })) ?? []

    return {
      [lineId]: newSeriesLine,
      [pointsId]: newSeriesPoints,
    }
  })

  return {
    subplot,
    derivedSeries,
  }
}
