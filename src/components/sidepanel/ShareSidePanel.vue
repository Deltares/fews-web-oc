<template>
  <SidePanelContent :title="t('sidePanel.share')" @close="emit('close')">
    <ShareMenu />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

import SidePanelContent from './SidePanelContent.vue'
import ShareMenu from '@/components/share/ShareMenu.vue'

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
