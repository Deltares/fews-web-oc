<template>
  <SidePanelContent :title="t('sidePanel.runTasks')" @close="emit('close')">
    <WhatIfDisplayView :topologyNode="topologyNode" />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

import SidePanelContent from './SidePanelContent.vue'
import WhatIfDisplayView from '@/views/WhatIfDisplayView.vue'

const { t } = useI18n()

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()
</script>
