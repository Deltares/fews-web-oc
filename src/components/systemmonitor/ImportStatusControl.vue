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
import { type TopologyNode } from '@deltares/fews-pi-requests'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import type {
  ImportExportStatusItem,
  StatusResultFilter,
  StatusSource,
} from './statusTypes'
import ImportStatusSummary from './ImportStatusSummary.vue'
import { useImportExportStatus } from './useImportExportStatus'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

interface Emits {
  openLogTaskRun: [taskRunId: string]
}
const emit = defineEmits<Emits>()

const { statusItems, startPolling, stopPolling } = useImportExportStatus({
  pollIntervalMs: 10000,
})
const expandedItems = ref<Record<string, boolean>>({})
const selectedSources = ref<StatusSource[]>(['import', 'export'])
const selectedResults = ref<StatusResultFilter[]>([
  'successful',
  'unsuccessful',
])

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
  stopPolling()
})

onMounted(async () => {
  await startPolling()
})
</script>

<style scoped>
.status-panel {
  min-height: 0;
}
</style>
