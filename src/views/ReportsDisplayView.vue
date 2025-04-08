<template>
  <div v-if="reports?.length" class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="showToolbar" density="compact">
      <template v-if="settings.report.reportName">
        <div v-if="reports.length === 1" class="ml-5">
          {{ reportToTitle(reports[0]) }}
        </div>
        <v-select
          v-else
          v-model="selectedReport"
          :items="reports"
          return-object
          :item-title="(item) => reportToTitle(item)"
          :item-value="(item) => item.moduleInstanceId"
          hide-details
          label="Report"
          class="px-2"
          menu-icon="mdi-chevron-down"
          variant="solo-filled"
          density="compact"
        />
      </template>
      <v-spacer />
      <template v-if="settings.report.analysisTimes">
        <template
          v-if="!settings.report.nonCurrentReports && selectedReportItem"
        >
          <div class="d-flex flex-column mr-3">
            <v-list-item-subtitle> Analysis time </v-list-item-subtitle>
            <div>{{ reportItemToTitle(selectedReportItem) }}</div>
          </div>
        </template>
        <v-select
          v-else
          v-model="selectedReportItem"
          :items="reportItems"
          return-object
          :item-title="(item) => reportItemToTitle(item)"
          :item-value="(item) => reportItemToId(item)"
          :item-props="
            (item) => ({ subtitle: item.isCurrent ? 'Current' : undefined })
          "
          hide-details
          label="Analysis time"
          class="pe-2 flex-0-0"
          menu-icon="mdi-chevron-down"
          variant="solo-filled"
          density="compact"
        />
      </template>
      <v-btn
        v-if="settings.report.downloadReport"
        @click="downloadFile"
        icon="mdi-download"
      />
    </v-toolbar>
    <ShadowFrame :htmlContent="reportHtml" />
  </div>
  <v-alert v-else class="ma-10">No reports available</v-alert>
</template>

<script setup lang="ts">
import { useReports } from '@/services/useReports'
import {
  type ReportItem,
  type Report,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import { downloadFileWithXhr } from '@/lib/download'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import ShadowFrame from '@/components/general/ShadowFrame.vue'
import { getReportUrl, useReport } from '@/services/useReport'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'

interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const showToolbar = computed(
  () =>
    props.settings.report.reportName ||
    props.settings.report.analysisTimes ||
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

const { reportHtml } = useReport(
  baseUrl,
  () => selectedReportItem.value?.moduleInstanceId,
  () => selectedReportItem.value?.taskRunId,
  () => selectedReportItem.value?.reportId,
)

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
  if (!report) return

  const url = getReportUrl(baseUrl, {
    moduleInstanceId: report.moduleInstanceId,
    taskRunId: report.taskRunId,
    reportId: report.reportId,
  })

  const fileName = `${report.timeZero}-${report.moduleInstanceId}`
  downloadFileWithXhr(
    url,
    fileName,
    authenticationManager.getAccessToken(),
  )
}
</script>
