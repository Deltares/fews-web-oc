import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  DynamicReportDisplayCapabilitiesResponse,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { MaybeRefOrGetter, ref, shallowRef, toValue, watchEffect } from 'vue'

export function useDynamicReport(
  baseUrl: string,
  displayId: MaybeRefOrGetter<string | undefined>,
  time: MaybeRefOrGetter<string | undefined>,
  locationId: MaybeRefOrGetter<string | undefined>,
  timeZero: MaybeRefOrGetter<string | undefined>,
) {
  const reportHtml = ref<string>('')
  const capabilities = ref<DynamicReportDisplayCapabilitiesResponse>()
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
    capabilities.value = response
  }

  async function loadReport() {
    const _displayId = toValue(displayId)
    const _time = toValue(time)
    const _locationId = toValue(locationId)
    const _timeZero = toValue(timeZero)

    if (_displayId === undefined) {
      reportHtml.value = ''
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
        time: _time,
        locationId: _locationId,
        timeZero: _timeZero,
        useLastValue: true,
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

  watchEffect(loadReport)
  watchEffect(loadCapability)

  return {
    reportHtml,
    capabilities,
    isReady,
    isLoading,
    error,
  }
}
