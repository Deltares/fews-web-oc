<template>
  <SidePanelContent :title="title" @close="emit('close')">
    <ImportStatusControl @open-log-task-run="emit('openLogTaskRun', $event)" />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'

import SidePanelContent from './SidePanelContent.vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'

interface Props {
  topologyNode?: TopologyNode
  title: string
}
defineProps<Props>()

interface Emits {
  close: []
  openLogTaskRun: [taskRunId: string]
}
const emit = defineEmits<Emits>()
</script>
