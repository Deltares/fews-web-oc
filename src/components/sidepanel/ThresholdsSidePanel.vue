<template>
  <SidePanelContent
    :title="t('sidePanel.thresholdOverview')"
    @close="emit('close')"
  >
    <ThresholdsOverview
      :topology-node="topologyNode"
      :location-ids="locationIds"
      @navigate="emit('navigate', $event)"
    />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useI18n } from 'vue-i18n'

import type { NavigateRoute } from '@/lib/router'

import SidePanelContent from './SidePanelContent.vue'
import ThresholdsOverview from '@/components/thresholds/ThresholdsOverview.vue'

const { t } = useI18n()

interface Props {
  topologyNode?: TopologyNode
  locationIds?: string
}
defineProps<Props>()

interface Emits {
  close: []
  navigate: [to: NavigateRoute]
}
const emit = defineEmits<Emits>()
</script>
