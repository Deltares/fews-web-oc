import { debounce } from 'lodash-es'
import {
  getCurrentScope,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import { overlapsTimeRange } from '@/lib/charts/zoom'

// Ratio between old and new domain when zooming above which no refetch is
// performed. Note: zooming out (i.e. zoom ratio > 1) will always refetch.
const MAX_ZOOM_RATIO_FOR_REFETCH = 0.8

// Minimum domain width in hours below which no refetch is done, because it is
// unlikely that there is any effect of thinning.
const MIN_HOURS_FOR_REFETCH = 12

export function useFetchDomain() {
  const domain = ref<{ startTime?: Date; endTime?: Date }>({})

  function shouldRefetchAfterDomainUpdate(newDomain: [Date, Date]): boolean {
    // Always refetch if we have no previously set domain; we have no guarantees
    // what the (FEWS-configured) domain is.
    const { startTime, endTime } = domain.value
    if (!startTime || !endTime) return true

    const newDomainRange = newDomain[1].getTime() - newDomain[0].getTime()
    const oldDomainRange = endTime.getTime() - startTime.getTime()
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
    const dateDomain = toDateDomain(newDomain)
    if (!dateDomain) return
    if (!shouldRefetchAfterDomainUpdate(dateDomain)) return

    // Request a time series update with the new domain by updating the
    // domain override, which feeds back into chartOptions via the computed.
    const [startTime, endTime] = dateDomain
    domain.value = { startTime, endTime }
  }
  const debouncedRefetchChartTimeSeries = debounce(refetchChartTimeSeries, 500)

  /** Fetch the whole period again, e.g. after selecting another period */
  function resetDomain() {
    debouncedRefetchChartTimeSeries.cancel()
    domain.value = {}
  }
  if (getCurrentScope()) {
    onScopeDispose(() => debouncedRefetchChartTimeSeries.cancel())
  }

  return {
    debouncedRefetchChartTimeSeries,
    domain,
    resetDomain,
  }
}

export interface ChartZoomOptions {
  /** The whole period the charts show when they are not zoomed */
  period: MaybeRefOrGetter<[Date, Date] | undefined>
  /**
   * Identifies the selected period. A change shows the whole period again.
   * It changes when the user selects a period, also the current one again,
   * but not when a running period moves with the time.
   */
  periodKey: MaybeRefOrGetter<unknown>
}

/**
 * The zoom state of a group of charts and the time range to fetch for it.
 *
 * `visibleDomain` is the range the user zoomed, panned or brushed to, or
 * undefined when the charts show the whole period. A zoom is kept while a
 * running period moves, until it no longer overlaps the period or another
 * period is selected.
 */
export function useChartZoom({ period, periodKey }: ChartZoomOptions) {
  const { debouncedRefetchChartTimeSeries, domain, resetDomain } =
    useFetchDomain()
  const visibleDomain = ref<[Date, Date]>()

  // Synchronous, so a period change does not first request the data of the
  // previous zoom for the new period
  watch(
    visibleDomain,
    (newDomain) => {
      if (newDomain) {
        debouncedRefetchChartTimeSeries(newDomain)
      } else {
        resetDomain()
      }
    },
    { flush: 'sync' },
  )

  /** Show and fetch the whole period again */
  function showWholePeriod() {
    visibleDomain.value = undefined
  }

  watch(() => toKey(toValue(periodKey)), showWholePeriod, { flush: 'sync' })

  watch(
    () => toValue(period),
    (newPeriod) => {
      if (
        visibleDomain.value &&
        !overlapsTimeRange(visibleDomain.value, newPeriod)
      ) {
        showWholePeriod()
      }
    },
    { flush: 'sync' },
  )

  return {
    visibleDomain,
    /** The time range to fetch, empty to fetch the whole period */
    fetchDomain: domain,
    showWholePeriod,
  }
}

function toKey(value: unknown): string {
  return JSON.stringify(value) ?? ''
}

function toDateDomain(domain: unknown): [Date, Date] | undefined {
  if (!Array.isArray(domain) || domain.length !== 2) return
  if (domain.some((date) => date === null || date === undefined)) return

  const dateDomain = domain.map((date) =>
    date instanceof Date ? date : new Date(date),
  )
  if (dateDomain.some((date) => Number.isNaN(date.getTime()))) return

  return dateDomain as [Date, Date]
}
