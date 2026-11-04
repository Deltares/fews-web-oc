import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DynamicReportDisplayCapabilitiesResponse,
  PiWebserviceProvider,
  DynamicReportDisplayFilter,
} from '@deltares/fews-pi-requests'
import { MaybeRefOrGetter, ref, shallowRef, toValue, watchEffect } from 'vue'

export type DynamicReportDisplayCapabilities =
  DynamicReportDisplayCapabilitiesResponse['dynamicReportDisplayCapabilities']

export function useDynamicReportCapabilities(
  baseUrl: string,
  displayId: MaybeRefOrGetter<string | undefined>,
) {
  const capabilities = ref<DynamicReportDisplayCapabilities>()

  async function loadCapability() {
    const _displayId = toValue(displayId)
    capabilities.value = undefined
    if (_displayId === undefined) return
    const provider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })
    const response = await provider.getDynamicReportDisplayCapabilities({
      displayId: _displayId,
    })
    // Ignore responses for a display that is no longer requested
    if (toValue(displayId) !== _displayId) return
    capabilities.value = response.dynamicReportDisplayCapabilities
  }
  watchEffect(loadCapability)

  return { capabilities }
}

export function useDynamicReportHtml(
  baseUrl: string,
  displayId: MaybeRefOrGetter<string | undefined>,
  capabilities: MaybeRefOrGetter<DynamicReportDisplayCapabilities | undefined>,
  filter: MaybeRefOrGetter<
    Omit<DynamicReportDisplayFilter, 'displayId'> | undefined
  >,
) {
  const reportHtml = ref<string>('')
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()
  let latestRequestId = 0

  async function loadReport() {
    const requestId = ++latestRequestId
    isLoading.value = false
    isReady.value = false
    error.value = undefined

    const _displayId = toValue(displayId)
    const _filter = toValue(filter)
    const _capabilities = toValue(capabilities)

    if (!_capabilities || _displayId === undefined) {
      reportHtml.value = ''
      return
    }

    if (!hasRequiredParameters(_capabilities, _filter)) {
      return
    }
    isLoading.value = true
    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const response = await provider.getDynamicReportDisplay({
        displayId: _displayId,
        useLastValue: true,
        ..._filter,
      })
      if (requestId !== latestRequestId) return
      reportHtml.value = response
    } catch {
      if (requestId !== latestRequestId) return
      error.value = 'Error loading report'
      reportHtml.value = ''
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
        isReady.value = true
      }
    }
  }
  watchEffect(loadReport)

  return {
    reportHtml,
    isReady,
    isLoading,
    error,
  }
}

export function useDynamicReport(
  baseUrl: string,
  displayId: MaybeRefOrGetter<string | undefined>,
  filter: MaybeRefOrGetter<
    Omit<DynamicReportDisplayFilter, 'displayId'> | undefined
  >,
) {
  const { capabilities } = useDynamicReportCapabilities(baseUrl, displayId)
  const report = useDynamicReportHtml(baseUrl, displayId, capabilities, filter)
  return {
    ...report,
    capabilities,
  }
}

function hasRequiredParameters(
  capabilities: DynamicReportDisplayCapabilities,
  filter: Omit<DynamicReportDisplayFilter, 'displayId'> | undefined,
): boolean {
  if (!capabilities) return false
  const validTimeParameter =
    capabilities.dimension?.name !== 'time' || filter?.time !== undefined
  const validLocationParameter =
    !capabilities.selectableLocations ||
    capabilities.selectableLocations.some(
      (loc) => loc.id === filter?.locationId,
    )
  return validTimeParameter && validLocationParameter
}

export interface DynamicReportPanelConfig {
  displayId: string
  capabilities: DynamicReportDisplayCapabilities
  locationId?: string
}

/**
 * Get the dynamic report panel config for the selected locations.
 * @returns `undefined` while the capabilities are not available,
 *   `null` if none of the selected locations is selectable in the report,
 *   otherwise the panel config.
 */
export function getDynamicReportPanelConfig(
  displayId: string | undefined,
  capabilities: DynamicReportDisplayCapabilities | undefined,
  locationIds: string[],
): DynamicReportPanelConfig | null | undefined {
  if (displayId === undefined || capabilities === undefined) return
  const selectableLocations = capabilities.selectableLocations
  if (!selectableLocations) return { displayId, capabilities }

  const locationId = locationIds.find((id) =>
    selectableLocations.some((location) => location.id === id),
  )
  if (locationId === undefined) return null
  return { displayId, capabilities, locationId }
}
