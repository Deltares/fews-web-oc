<template>
  <LogSidePanelComponent
    v-if="logDisplay"
    :logDisplay="logDisplay"
    :taskRunId="taskRunId"
    :noteGroup="noteGroup"
    :key="logDisplay.id"
  />
</template>

<script setup lang="ts">
import LogSidePanelComponent from '@/components/logdisplay/LogSidePanelComponent.vue'
import { type TopologyNode } from '@deltares/fews-pi-requests'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useNoteGroup } from '@/services/useNoteGroup/index.ts'

interface Props {
  topologyNode?: TopologyNode
  logDisplayId: string | undefined
  taskRunId?: string
}

const props = defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

const { logDisplay } = useLogDisplay(() => props.logDisplayId)
const { noteGroup } = useNoteGroup(
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
