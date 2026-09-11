<template>
  <div class="d-flex flex-column h-100 w-100">
    <ReportSnapshotStrip
      v-if="showReportSnapshots"
      v-model:selectedReport="selectedReport"
      :baseUrl="baseUrl"
      :reports="reports ?? []"
    />
    <div
      class="report-display-view__canvas w-100 flex-grow-1 overflow-y-auto"
      @scroll="updateToolbarPosition"
    >
      <v-toolbar
        v-if="showToolbar"
        density="compact"
        class="report-display-view__toolbar"
        :class="{
          'report-display-view__toolbar--over-report': toolbarOverReport,
          'report-display-view__toolbar--controls-visible':
            analysisTimeMenuOpen,
        }"
      >
        <template v-if="settings.report.reportName">
          <div v-if="!reports?.length" class="report-display-view__label ml-5">
            No reports available
          </div>
          <v-sheet
            v-else-if="selectedReport"
            elevation="1"
            class="report-display-view__label ml-5"
          >
            {{ reportToTitle(selectedReport) }}
        </v-sheet>
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
            v-else-if="reportItems.length > 0"
            v-model="selectedReportItem"
            v-model:menu="analysisTimeMenuOpen"
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
            :menu-props="{
              contentClass: 'report-display-view__analysis-time-menu',
            }"
            variant="solo"
            density="compact"
          />
        </template>
        <v-btn
          v-if="selectedReportItem && settings.report.downloadReport"
          icon
          size="small"
          @click="downloadFile"
          elevation="1"
          aria-label="Download Report"
        >
          <v-icon>mdi-download</v-icon>
          <v-tooltip activator="parent" location="bottom"
            >Download Report</v-tooltip
          >
        </v-btn>
      </v-toolbar>
      <ReactiveIframe
        :src="src"
        class="report-display-view__item w-100"
      ></ReactiveIframe>
    </div>
  </div>
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
import ReactiveIframe from '@/components/products/ReactiveIframe.vue'
import ReportSnapshotStrip from '@/components/reports/ReportSnapshotStrip.vue'
import { getReportUrl, useReport } from '@/services/useReport'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { getReportModuleInstanceIdsForNode } from '@/lib/topology/nodes'

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
  return getReportModuleInstanceIdsForNode(props.topologyNode)
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { reports } = useReports(baseUrl, moduleInstanceIds)

const selectedReport = ref<Report>()
const toolbarOverReport = ref(false)
const analysisTimeMenuOpen = ref(false)
const showReportSnapshots = computed(
  () =>
    props.topologyNode?.topologyNodes !== undefined &&
    (reports.value?.length ?? 0) > 1,
)
const reportItems = computed(() => {
  return selectedReport.value?.items ?? []
})

const src = computed(() => {
  if (!reportHtml.value) return ''
  const blob = new Blob([reportHtml.value], { type: 'text/html' })
  const url = globalThis.URL.createObjectURL(blob)
  return url
})

const selectedReportItem = ref<ReportItem>()
watch(reports, () => {
  if (reports.value?.length) {
    selectedReport.value =
      reports.value.find((r) => r.items.find((i) => i.isCurrent)) ??
      reports.value[0]
  } else {
    selectedReport.value = undefined
  }
})

watch(selectedReport, () => {
  const items = selectedReport.value?.items
  if (items?.length) {
    selectedReportItem.value = items.find((i) => i.isCurrent) ?? items[0]
  } else {
    selectedReportItem.value = undefined
  }
})

const { reportHtml } = useReport(
  baseUrl,
  () => selectedReportItem.value?.moduleInstanceId,
  () => selectedReportItem.value?.taskRunId,
  () => selectedReportItem.value?.reportId,
)

function updateToolbarPosition(event: Event) {
  toolbarOverReport.value = (event.currentTarget as HTMLElement).scrollTop > 0
}

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
  const headers = await authenticationManager.getAuthorizationHeaders()
  await downloadFileWithXhr(url, fileName, headers)
}
</script>

<style scoped>
.report-display-view__toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: transparent;
}

.report-display-view__toolbar :deep(.v-toolbar__content > *) {
  opacity: 1;
  transition: opacity 0.15s ease-in-out;
}

.report-display-view__toolbar--over-report :deep(.v-toolbar__content > *) {
  opacity: 0;
}

.report-display-view__toolbar:hover :deep(.v-toolbar__content > *),
.report-display-view__toolbar:focus-within :deep(.v-toolbar__content > *),
.report-display-view__toolbar--controls-visible :deep(.v-toolbar__content > *) {
  opacity: 1;
}

.report-display-view__toolbar :deep(.v-field),
.report-display-view__toolbar :deep(.v-btn),
.report-display-view__label {
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-surface), 0.75);
  -webkit-backdrop-filter: blur(8px);
}

.report-display-view__label {
  padding: 4px 8px;
  border-radius: 4px;
}

.report-display-view__item {
  background-color: white;
}

:global(.report-display-view__analysis-time-menu) {
  background-color: transparent;
}

:global(.report-display-view__analysis-time-menu .v-list),
:global(.report-display-view__analysis-time-menu .v-sheet) {
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-surface), 0.75) !important;
  -webkit-backdrop-filter: blur(8px);
}

:global(.report-display-view__analysis-time-menu .v-list-item) {
  background-color: transparent;
}
</style>
