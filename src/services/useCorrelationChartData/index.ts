import { CorrelationChart } from '@/lib/analysis'
import { Series } from '@/lib/timeseries/timeSeries'
import {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { computed, MaybeRefOrGetter, toValue } from 'vue'
import { useCorrelation } from '@/services/useCorrelation'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { convertJSDateToFewsPiParameter } from '@/lib/date'

export function useCorrelationChartData(
  chart: MaybeRefOrGetter<CorrelationChart>,
  startTime: MaybeRefOrGetter<Date>,
  endTime: MaybeRefOrGetter<Date>,
) {
  const filter = computed(() => ({
    ...toValue(chart).filter,
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
    const _chart = toValue(chart)

    const description = correlation.value?.equation?.description
    const rSquared = correlation.value?.equation?.['R-squared']
    const legend = `${description} with r²=${rSquared?.toFixed(3)}`
    return getSubplot(
      _chart.timeSeriesNameXAxis,
      _chart.timeSeriesNameYAxis,
      lineId,
      pointsId,
      legend,
    )
  })

  const series = computed(() => {
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
    series,
  }
}
