import { Series } from '@/lib/timeseries/timeSeries'
import { computed, MaybeRefOrGetter } from 'vue'
import { useCorrelation } from '@/services/useCorrelation'
import { SeriesResourceType } from '@/lib/timeseries/types'
import {
  CORRELATION_LINE_ID,
  CORRELATION_POINTS_ID,
} from '@/lib/analysis/correlation'
import type { CorrelationFilter } from '@deltares/fews-pi-requests'

export function useCorrelationChartData(
  filter: MaybeRefOrGetter<CorrelationFilter | undefined>,
) {
  const { correlation } = useCorrelation(filter)

  const description = computed(() => {
    return correlation.value?.equation?.description
  })

  const rSquared = computed(() => {
    return correlation.value?.equation?.['R-squared']
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
      [CORRELATION_LINE_ID]: newSeriesLine,
      [CORRELATION_POINTS_ID]: newSeriesPoints,
    }
  })

  return {
    series,
    description,
    rSquared,
  }
}
