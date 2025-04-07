import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider, ReportFilter } from '@deltares/fews-pi-requests'
import { MaybeRefOrGetter, ref, shallowRef, toValue, watchEffect } from 'vue'

export function useReport(
  baseUrl: string,
  moduleInstanceId: MaybeRefOrGetter<string | undefined>,
  taskRunId: MaybeRefOrGetter<string | undefined>,
  reportId: MaybeRefOrGetter<number | undefined>,
) {
  const reportHtml = ref<string>('')
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadReport() {
    const _moduleInstanceId = toValue(moduleInstanceId)
    const _taskRunId = toValue(taskRunId)
    const _reportId = toValue(reportId)

    if (
      _moduleInstanceId === undefined ||
      _taskRunId === undefined ||
      _reportId === undefined
    ) {
      reportHtml.value = ''
      return
    }

    isLoading.value = true
    isReady.value = false
    try {
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const response = await provider.getReport({
        moduleInstanceId: _moduleInstanceId,
        taskRunId: _taskRunId,
        reportId: _reportId,
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

  return {
    reportHtml,
    isReady,
    isLoading,
    error,
  }
}

export function getReportUrl(baseUrl: string, filter: ReportFilter) {
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  return provider.reportUrl(filter)
}
