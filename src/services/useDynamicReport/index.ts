import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DynamicReportDisplayCapabilitiesResponse,
  PiWebserviceProvider,
  DynamicReportDisplayFilter,
} from '@deltares/fews-pi-requests'
import {
  MaybeRefOrGetter,
  ref,
  shallowRef,
  toValue,
  watch,
  watchEffect,
} from 'vue'

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
    isReady.value = false
    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const response = await provider.getDynamicReportDisplay({
        displayId: _displayId,
        useLastValue: true,
        ..._filter,
      })
      reportHtml.value = response
    } catch {
      error.value = 'Error loading report'
      reportHtml.value = ''
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }
  watchEffect(loadCapability)
  watch(() => filter, loadReport, { deep: true })

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
    !(capabilities.dimension?.name === 'time') || filter?.time !== undefined
  const validLocationParameter =
    !capabilities.selectableLocations ||
    capabilities.selectableLocations.findIndex(
      (loc) => loc.id === filter?.locationId,
    ) !== -1
  return validTimeParameter && validLocationParameter
}
