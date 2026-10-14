<template>
  <div class="status-panel h-100 d-flex flex-column">
    <div class="d-flex pt-3 pb-2 align-center flex-shrink-0">
      <BaseTaskFilterControl
        v-if="isCombinedMode"
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
            @open-side-panel="emit('openSidePanel', $event)"
          />
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import BaseTaskFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import type {
  ImportExportStatusItem,
  StatusResultFilter,
  StatusSource,
} from './statusTypes'
import ImportStatusSummary from './ImportStatusSummary.vue'
import type { SidePanelRequest } from '@/lib/sidepanel'
import { useImportExportStatus } from './useImportExportStatus'

interface Props {
  statusType?: 'import' | 'export' | 'all'
}

const props = withDefaults(defineProps<Props>(), {
  statusType: 'all',
})

interface Emits {
  openSidePanel: [request: SidePanelRequest]
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

const isCombinedMode = computed(() => props.statusType === 'all')

watch(
  () => props.statusType,
  (statusType) => {
    if (statusType === 'import') {
      selectedSources.value = ['import']
    } else if (statusType === 'export') {
      selectedSources.value = ['export']
    } else {
      selectedSources.value = ['import', 'export']
    }
  },
  { immediate: true },
)

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
    const sourceMatches =
      props.statusType === 'all'
        ? selectedSources.value.includes(item.statusType)
        : item.statusType === props.statusType

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
