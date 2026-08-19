<template>
  <div class="status-panel h-100 d-flex flex-column">
    <div class="d-flex pt-3 pb-2 align-center flex-shrink-0">
      <BaseTaskFilterControl
        v-model="selectedSources"
        :items="sourceFilterOptions"
        label="Source"
      />
      <BaseTaskFilterControl
        v-model="selectedResults"
        :items="resultFilterOptions"
        label="Status"
      />
    </div>

    <v-virtual-scroll
      v-if="filteredStatusItems.length"
      class="overflow-y-auto flex-grow-1"
      :items="filteredStatusItems"
      :item-height="62"
    >
      <template #default="{ item }">
        <div class="my-1 mx-2">
          <ImportStatusSummary
            :item="item"
            v-model:expanded="expandedItems[item.dataFeed]"
            @open-log-task-run="emit('openLogTaskRun', $event)"
          />
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import {
  PiWebserviceProvider,
  type ExportStatus,
  type ImportStatus,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import type {
  ImportExportStatusItem,
  StatusResultFilter,
  StatusSource,
} from './statusTypes'
import ImportStatusSummary from './ImportStatusSummary.vue'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

interface Emits {
  openLogTaskRun: [taskRunId: string]
}
const emit = defineEmits<Emits>()

const statusItems = ref<ImportExportStatusItem[]>([])
const expandedItems = ref<Record<string, boolean>>({})
const selectedSources = ref<StatusSource[]>(['import', 'export'])
const selectedResults = ref<StatusResultFilter[]>([
  'successful',
  'unsuccessful',
])
let active: boolean = false

const sourceFilterOptions: Array<{
  id: string
  title: string
  value: StatusSource
}> = [
  { id: 'import', title: 'Import', value: 'import' },
  { id: 'export', title: 'Export', value: 'export' },
]

const resultFilterOptions: Array<{
  id: string
  title: string
  value: StatusResultFilter
}> = [
  { id: 'successful', title: 'Successful', value: 'successful' },
  { id: 'unsuccessful', title: 'Unsuccessful', value: 'unsuccessful' },
]

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

const filteredStatusItems = computed<ImportExportStatusItem[]>(() => {
  return statusItems.value.filter((item) => {
    const sourceMatches = selectedSources.value.includes(item.statusType)
    const resultType: StatusResultFilter =
      item.filesFailedCount > 0 ? 'unsuccessful' : 'successful'
    const resultMatches = selectedResults.value.includes(resultType)
    return sourceMatches && resultMatches
  })
})

onUnmounted(() => {
  active = false
})

onMounted(async () => {
  active = true
  await loadStatuses()
})

function normalizeStatuses(
  items: (ImportStatus | ExportStatus)[],
  statusType: 'import' | 'export',
): ImportExportStatusItem[] {
  return items.map((item) => ({
    ...item,
    statusType,
  }))
}

async function loadStatuses() {
  try {
    if (!active) return

    const [importResult, exportResult] = await Promise.allSettled([
      webServiceProvider.getImportStatus(),
      webServiceProvider.getExportStatus(),
    ])

    const importItems =
      importResult.status === 'fulfilled'
        ? normalizeStatuses(importResult.value.importStatus, 'import')
        : []
    const exportItems =
      exportResult.status === 'fulfilled'
        ? normalizeStatuses(exportResult.value.exportStatus, 'export')
        : []

    statusItems.value = [...importItems, ...exportItems]
  } catch (error) {
    console.warn(error)
  } finally {
    setTimeout(loadStatuses, 10000)
  }
}
</script>

<style scoped>
.status-panel {
  min-height: 0;
}
</style>
