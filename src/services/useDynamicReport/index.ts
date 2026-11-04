import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DynamicReportDisplayCapabilitiesResponse,
  PiWebserviceProvider,
  DynamicReportDisplayFilter,
} from '@deltares/fews-pi-requests'
import { MaybeRefOrGetter, ref, shallowRef, toValue, watchEffect } from 'vue'

export function useDynamicReport(
  baseUrl: string,
  displayId: MaybeRefOrGetter<string | undefined>,
  filter: MaybeRefOrGetter<
    Omit<DynamicReportDisplayFilter, 'displayId'> | undefined
  >,
) {
  const reportHtml = ref<string>('')
  const capabilities =
    ref<
      DynamicReportDisplayCapabilitiesResponse['dynamicReportDisplayCapabilities']
    >()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()
  let latestRequestId = 0

  async function loadCapability() {
    const _displayId = toValue(displayId)
    if (_displayId === undefined) return {}
    const provider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })
    const response = await provider.getDynamicReportDisplayCapabilities({
      displayId: _displayId,
    })
    capabilities.value = response.dynamicReportDisplayCapabilities
  }

  async function loadReport() {
    const requestId = ++latestRequestId
    isLoading.value = false
    isReady.value = false
    error.value = undefined

    const _displayId = toValue(displayId)
    const _filter = toValue(filter)

    if (!capabilities.value || _displayId === undefined) {
      reportHtml.value = ''
      return
    }

    if (!hasRequiredParameters(capabilities.value, _filter)) {
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
  watchEffect(loadCapability)
  watchEffect(loadReport)

  return {
    reportHtml,
    capabilities,
    isReady,
    isLoading,
    error,
  }
}

function hasRequiredParameters(
  capabilities: DynamicReportDisplayCapabilitiesResponse['dynamicReportDisplayCapabilities'],
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
