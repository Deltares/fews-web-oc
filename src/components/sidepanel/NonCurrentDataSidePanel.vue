<template>
  <SidePanelContent
    :title="t('sidePanel.noncurrentData')"
    @close="emit('close')"
  >
    <NonCurrentDataPanel :topologyNode="topologyNode" />
  </SidePanelContent>
</template>
<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

import SidePanelContent from './SidePanelContent.vue'
import NonCurrentDataPanel from '@/components/compare/NonCurrentDataPanel.vue'

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
