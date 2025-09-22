<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <v-card-text class="py-2 h-100 flex-grow-1">
      <div class="d-flex w-100">
        <div class="w-100">
          <div class="d-flex align-center ga-1 w-100">
            <v-tooltip>
              <template #activator="{ props: tooltipProps }">
                <v-chip
                  class="me-1 flex-0-0"
                  size="small"
                  :color="props.item.lastImportTimeBackgroundColor"
                  variant="flat"
                  v-bind="tooltipProps"
                >
                  {{ toHumanReadableDate(props.item.lastImportTime) }}
                </v-chip>
              </template>
              <span>Last import time</span>
            </v-tooltip>
            <div class="flex-1-1 overflow-hidden">
              <div :class="{ 'text-wrap': expanded }">
                {{ props.item.dataFeed }}
              </div>
            </div>
            <v-tooltip>
              <template #activator="{ props: tooltipProps }">
                <v-chip
                  size="small"
                  :color="getColor(props.item.fileFailed)"
                  variant="flat"
                  v-bind="tooltipProps"
                >
                  {{ props.item.fileFailed }}
                </v-chip>
              </template>
              <span>Failed imports</span>
            </v-tooltip>
          </div>
        </div>
      </div>
      <DataTable v-if="expanded" class="mt-4" :tableData="tableData" />
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import DataTable from '@/components/general/DataTable.vue'
import type { ImportStatus } from '@deltares/fews-pi-requests'
import { toHumanReadableDate } from '@/lib/date'

interface ImportStatusDirectory extends ImportStatus {
  directory: string
}

interface Props {
  item: ImportStatusDirectory
}
const props = defineProps<Props>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const tableData = computed(() => [
  {
    columns: [
      { header: 'Source', value: props.item.dataFeed || '' },
      {
        header: 'Directory',
        value: props.item.directory || props.item.dataFeed || '',
      },
    ],
  },
  {
    columns: [
      {
        header: 'Last Import Time',
        value: toHumanReadableDate(props.item.lastImportTime) || '',
      },
      {
        header: 'Last File Imported',
        value: props.item.lastFileImported || '',
      },
    ],
  },
  {
    columns: [
      { header: 'Files Imported', value: String(props.item.fileRead || 0) },
      { header: 'Failed Imports', value: String(props.item.fileFailed || 0) },
    ],
  },
])

function getColor(failure: number): string {
  if (failure == 0) return 'grey'
  return 'red'
}

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
}

.text-wrap-no {
  white-space: nowrap;
}
</style>
