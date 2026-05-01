<template>
  <SidePanelContent
    :is-active="isActive"
    :title="t('sidePanel.taskOverview')"
    @close="emit('close')"
  >
    <TaskRunsPanel :topology-node="topologyNode" />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

import SidePanelContent from './SidePanelContent.vue'
import TaskRunsPanel from '@/components/tasks/TaskRunsPanel.vue'

const { t } = useI18n()

interface Props {
  isActive: boolean
  topologyNode?: TopologyNode
}
defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()
</script>
