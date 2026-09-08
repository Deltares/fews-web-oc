<template>
  <SidePanelContent :title="title" @close="emit('close')" class="h-100">
    <LogSidePanelComponent
      v-if="logDisplay"
      :logDisplay="logDisplay"
      :taskRunId="settings.taskRunId"
      :noteGroup="noteGroup"
      :key="logDisplay.id"
    />
  </SidePanelContent>
</template>

<script setup lang="ts">
import LogSidePanelComponent from '@/components/logdisplay/LogSidePanelComponent.vue'
import SidePanelContent from './SidePanelContent.vue'
import { type TopologyNode } from '@deltares/fews-pi-requests'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useNoteGroup } from '@/services/useNoteGroup/index.ts'

interface Props {
  topologyNode?: TopologyNode
  title: string
  settings: {
    logDisplayId: string | undefined
    taskRunId?: string
  }
}

const props = defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

const { logDisplay } = useLogDisplay(() => props.settings.logDisplayId)
const { noteGroup } = useNoteGroup(
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
