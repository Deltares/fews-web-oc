<template>
  <SidePanelContent :title="t('sidePanel.importStatus')" @close="emit('close')">
    <ImportStatusControl @open-log-task-run="emit('openLogTaskRun', $event)" />
  </SidePanelContent>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import SidePanelContent from './SidePanelContent.vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'

const { t } = useI18n()

interface Emits {
  close: []
  openLogTaskRun: [taskRunId: string]
}
const emit = defineEmits<Emits>()
</script>
