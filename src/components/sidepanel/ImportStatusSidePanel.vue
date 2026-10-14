<template>
  <div v-if="hasVisibleStatus" class="d-flex flex-column h-100 w-100">
    <ImportStatusControl
      :status-type="effectiveStatusType"
      @open-side-panel="emit('openSidePanel', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
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
  return 'all'
})

const emit = defineEmits(['openSidePanel'])
</script>
