import { debounce } from 'lodash-es'
import type { Ref } from 'vue'
import type { UseTimeSeriesOptions } from '@/services/useTimeSeries'

// Ratio between old and new domain when zooming above which no refetch is
// performed. Note: zooming out (i.e. zoom ratio > 1) will always refetch.
const MAX_ZOOM_RATIO_FOR_REFETCH = 0.8

// Minimum domain width in hours below which no refetch is done, because it is
// unlikely that there is any effect of thinning.
const MIN_HOURS_FOR_REFETCH = 12

export function useFetchDomain(chartOptions: Ref<UseTimeSeriesOptions>) {
  function shouldRefetchAfterDomainUpdate(newDomain: [Date, Date]): boolean {
    // Always refetch if we have no previously set domain; we have no guarantees
    // what the (FEWS-configured) domain is.
    if (!chartOptions.value.startTime || !chartOptions.value.endTime)
      return true

    const newDomainRange = newDomain[1].getTime() - newDomain[0].getTime()
    const oldDomainRange =
      chartOptions.value.endTime.getTime() -
      chartOptions.value.startTime.getTime()
    const zoomRatio = newDomainRange / oldDomainRange

    // Detect panning; we should always refetch if we are panning.
    const isPanning = Math.abs(zoomRatio - 1.0) < 1e-6
    if (isPanning) return true

    // Do not refetch if we are zoomed in past the point where thinning has
    // any effect.
    const isDomainLargeEnough =
      newDomainRange >= MIN_HOURS_FOR_REFETCH * 60 * 60 * 1000
    if (!isDomainLargeEnough) return false

    // When zooming out, always refresh the data; we need more data than we had
    // before.
    // When zooming in, only fetch new data when zooming in more than a threshold,
    // to prevent small changes in domain from updating all the data due to a
    // slightly changed thinning parameter.
    const isZoomingOut = zoomRatio > 1
    const isZoomingInEnough = zoomRatio < MAX_ZOOM_RATIO_FOR_REFETCH
    return isZoomingOut || isZoomingInEnough
  }

  function refetchChartTimeSeries(newDomain: [Date, Date]) {
    if (!shouldRefetchAfterDomainUpdate(newDomain)) return

    // Request a time series update with the new domain by setting a new
    // lastUpdated value.
    const [startTime, endTime] = newDomain
    chartOptions.value = { ...chartOptions.value, startTime, endTime }
  }
  const debouncedRefetchChartTimeSeries = debounce(refetchChartTimeSeries, 500)

  return {
    debouncedRefetchChartTimeSeries,
  }
}
