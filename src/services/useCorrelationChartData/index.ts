import { Series } from '@/lib/timeseries/timeSeries'
import { computed, MaybeRefOrGetter } from 'vue'
import { useCorrelation } from '@/services/useCorrelation'
import { SeriesResourceType } from '@/lib/timeseries/types'
import {
  CORRELATION_LINE_ID,
  CORRELATION_POINTS_ID,
} from '@/lib/analysis/correlation'
import type { CorrelationFilter } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

export function useCorrelationChartData(
  filter: MaybeRefOrGetter<CorrelationFilter | undefined>,
) {
  const { correlation, isLoading, error } = useCorrelation(filter)

  const hasScatterPoints = computed(
    () => (correlation.value?.values?.length ?? 0) > 0,
  )

  const hasRegressionFit = computed(
    () => (correlation.value?.fitPoints?.length ?? 0) > 0,
  )

  const description = computed(() => {
    return correlation.value?.equation?.description
  })

  const statusDescription = computed(() => {
    const equation = correlation.value?.equation
    return equation && equation.status !== 'nominal'
      ? equation.statusDescription
      : undefined
  })

  const rSquared = computed(() => {
    return correlation.value?.equation?.rSquared
  })

  const { t } = useI18n()

  const errorState = computed(() => {
    if (isLoading.value || (!error.value && hasScatterPoints.value)) return

    const type: 'error' | 'warning' = error.value ? 'error' : 'warning'

    return {
      type,
      message: error.value
        ? t('analysis.correlation.loadError')
        : (statusDescription.value ?? t('analysis.correlation.noData')),
    }
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
    statusDescription,
    rSquared,
    hasScatterPoints,
    hasRegressionFit,
    isLoading,
    error,
    errorState,
  }
}
