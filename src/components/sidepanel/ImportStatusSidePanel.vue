<template>
  <ImportStatusControl @open-log-task-run="emit('openLogTaskRun', $event)" />
</template>

<script setup lang="ts">
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()

interface Emits {
  close: []
  openLogTaskRun: [taskRunId: string]
}
const emit = defineEmits<Emits>()
</script>
