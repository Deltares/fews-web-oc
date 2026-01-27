import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'
import {
  type AggregationItem,
  getRelativeStartDateForLabel,
  shortLabel,
} from '@/lib/aggregation'
import { Layer } from '@deltares/fews-wms-requests'

export function useAggregations(
  selectedDate: MaybeRefOrGetter<Date | undefined>,
  layerCapabilities: MaybeRefOrGetter<Layer | undefined>,
) {
  const aggregationLabels = computed<string[]>(() => {
    // For now, we only ever have one entry for aggregation: "Accumulation".
    const capabilities = toValue(layerCapabilities)
    return capabilities?.aggregation?.[0].labels ?? []
  })

  const doShowAggregated = ref<boolean>(true)
  const selectedAggregationLabel = ref<string | null>(
    aggregationLabels.value[0] ?? null,
  )

  const aggregations = computed<AggregationItem[]>(() => {
    const capabilities = toValue(layerCapabilities)
    const forecastTimeString = capabilities?.keywordList?.[0].forecastTime
    const forecastTime = forecastTimeString
      ? new Date(forecastTimeString)
      : undefined

    const _selectedDate = toValue(selectedDate)

    const forecastTimeIsBeforeSelectedDate =
      forecastTime !== undefined &&
      _selectedDate !== undefined &&
      forecastTime < _selectedDate

    const displayTimeStartDate = forecastTimeIsBeforeSelectedDate
      ? forecastTime
      : _selectedDate
    const displayTimeEndDate = forecastTimeIsBeforeSelectedDate
      ? _selectedDate
      : forecastTime

    const aggregation = capabilities?.aggregation?.[0]
    const aggregationType = aggregation?.aggregationType ?? 'unknown'
    const labels = aggregation?.labels ?? []

    return labels.map((label) => ({
      id: label,
      type: aggregationType,
      label: label,
      shortLabel: shortLabel(label),
      icon: label === 'to Display Time' ? 'mdi-swap-horizontal' : undefined,
      startDate:
        label === 'to Display Time'
          ? displayTimeStartDate
          : getRelativeStartDateForLabel(label, _selectedDate),
      endDate: label === 'to Display Time' ? displayTimeEndDate : _selectedDate,
    }))
  })

  watch(
    () => aggregations.value,
    (items) => {
      if (
        selectedAggregationLabel.value === null ||
        !items.find((item) => item.id === selectedAggregationLabel.value)
      ) {
        selectedAggregationLabel.value = items[0]?.id ?? null
      }
    },
    { immediate: true },
  )

  return {
    aggregations,
    doShowAggregated,
    selectedAggregationLabel,
  }
}
