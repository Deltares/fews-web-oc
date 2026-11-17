<template>
  <div v-if="hasVisibleStatus" class="d-flex flex-column h-100 w-100">
    <ImportExportStatusControl
      :status-type="effectiveStatusType"
      @open-side-panel="emit('openSidePanel', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ImportExportStatusControl from '@/components/systemmonitor/ImportExportStatusControl.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
  statusType?: 'import' | 'export' | 'all'
  showImport?: boolean
  showExport?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  statusType: 'all',
  showImport: false,
  showExport: false,
})

const hasVisibleStatus = computed(() => props.showImport || props.showExport)

const effectiveStatusType = computed<'import' | 'export' | 'all'>(() => {
  if (props.showImport && props.showExport) return 'all'
  if (props.showImport) return 'import'
  if (props.showExport) return 'export'
  return props.statusType
})

const emit = defineEmits(['openSidePanel'])
</script>
