<template>
  <SidePanelContent
    :title="logDisplay?.name ?? t('sidePanel.logDisplay')"
    @close="emit('close')"
    class="h-100"
  >
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
import { useI18n } from 'vue-i18n'
import LogSidePanelComponent from '@/components/logdisplay/LogSidePanelComponent.vue'

import { type TopologyNode } from '@deltares/fews-pi-requests'

import SidePanelContent from './SidePanelContent.vue'
import { useLogDisplay } from '@/services/useLogDisplay'
import { useNoteGroup } from '@/services/useNoteGroup/index.ts'

interface Props {
  topologyNode?: TopologyNode
  settings: {
    logDisplayId: string | undefined
    taskRunId?: string
  }
}

const props = defineProps<Props>()

const { t } = useI18n()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

const { logDisplay } = useLogDisplay(() => props.settings.logDisplayId)
const { noteGroup } = useNoteGroup(
  () => logDisplay.value?.manualLog?.noteGroupId,
)
</script>
