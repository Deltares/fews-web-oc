<template>
  <div v-if="reports?.length" class="d-flex flex-column h-100">
    <v-toolbar
      class="py-1"
      :title="reports.length === 1 ? reportToTitle(reports[0]) : undefined"
      density="compact"
    >
      <v-select
        v-if="reports.length > 1"
        v-model="selectedReport"
        :items="reports"
        return-object
        :item-title="(item) => reportToTitle(item)"
        :item-value="(item) => item.moduleInstanceId"
        hide-details
        label="Report"
        class="px-2"
        variant="solo-filled"
        density="compact"
      />
      <v-select
        v-model="selectedReportItem"
        :items="reportItems"
        return-object
        :item-title="(item) => reportItemToTitle(item)"
        :item-value="(item) => reportItemToId(item)"
        hide-details
        label="Analysis time"
        class="pe-2 flex-0-0"
        variant="solo-filled"
        density="compact"
      />
    </v-toolbar>
    <iframe :key="url" :src="url" class="html-content" />
  </div>
  <v-alert v-else class="ma-10">No reports available</v-alert>
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

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

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
  return `${item.timeZero} - ${item.reportId}`
}

function reportToTitle(item: Report) {
  return item.moduleInstanceName ?? item.moduleInstanceId
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
