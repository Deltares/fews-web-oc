<template>
  <div class="d-flex flex-column h-100 w-100">
    <div class="html-content" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
import { useReports } from '@/services/useReports'
import {
  PiWebserviceProvider,
  type ReportItem,
  type Report,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { filterToParams } from '@deltares/fews-wms-requests'
import { downloadFileWithXhr } from '@/lib/download'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { asyncComputed } from '@vueuse/core'

interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const html = asyncComputed(async () => {
  const response = await fetch(`${window.location.origin}/report.html`)
  return await response.text()
})

const showToolbar = computed(
  () =>
    !props.settings.report.hideReportName ||
    !props.settings.report.hideAnalysisTime ||
    props.settings.report.downloadReport,
)

const moduleInstanceIds = computed(() => {
  return (
    props.topologyNode?.reportDisplay?.reports.map((r) => r.moduleInstanceId) ??
    []
  )
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { reports } = useReports(baseUrl, moduleInstanceIds)

const selectedReport = ref<Report>()
const reportItems = computed(() => {
  return selectedReport.value?.items ?? []
})

const selectedReportItem = ref<ReportItem>()
watch(reports, () => {
  if (reports.value?.length) {
    selectedReport.value =
      reports.value.find((r) => r.items.find((i) => i.isCurrent)) ??
      reports.value[0]
  }
})

watch(selectedReport, () => {
  const items = selectedReport.value?.items
  if (!items) return

  selectedReportItem.value = items.find((i) => i.isCurrent) ?? items[0]
})

const url = computed(() => {
  if (!selectedReportItem.value) return undefined

  const queryParameters = filterToParams({
    moduleInstanceId: selectedReportItem.value.moduleInstanceId,
    taskRunId: selectedReportItem.value.taskRunId,
    reportId: selectedReportItem.value.reportId,
  })
  const provider = new PiWebserviceProvider(baseUrl)
  return `${baseUrl}${provider.API_ENDPOINT}/report${queryParameters}`
})

function reportItemToId(item: ReportItem) {
  return `${item.moduleInstanceId} - ${item.taskRunId} - ${item.reportId}`
}

function reportItemToTitle(item: ReportItem) {
  return `${item.timeZero}`
}

function reportToTitle(item: Report) {
  return item.moduleInstanceName ?? item.moduleInstanceId
}

async function downloadFile() {
  const report = selectedReportItem.value
  if (!report || !url.value) return

  const fileName = `${report.timeZero}-${report.moduleInstanceId}`
  downloadFileWithXhr(url.value, fileName)
}
</script>

<style scoped>
.html-content {
  height: 100%;
  width: 100%;
  border: none;
  overflow-y: auto;
}
</style>
