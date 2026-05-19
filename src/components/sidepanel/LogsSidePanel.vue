<template>
  <SidePanelContent :title="t('sidePanel.logDisplay')" @close="emit('close')">
  </SidePanelContent>
</template>

<script setup lang="ts">
import SidePanelContent from './SidePanelContent.vue'

import { type TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const { t } = useI18n()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()
</script>
