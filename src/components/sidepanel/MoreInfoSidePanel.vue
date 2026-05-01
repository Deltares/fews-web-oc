<template>
  <SidePanelContent :title="t('sidePanel.documentFile')" @close="emit('close')">
    <iframe
      v-if="url !== null"
      :src="url"
      title="Information Document"
      class="w-100 h-100 ma-0 pa-0 border-none"
    ></iframe>
    <div v-else class="pa-4">
      <span>No information document configured</span>
    </div>
  </SidePanelContent>
</template>
<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { getResourcesStaticUrl } from '@/lib/fews-config'

import SidePanelContent from './SidePanelContent.vue'

const { t } = useI18n()

interface Props {
  topologyNode?: TopologyNode
}
const props = defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()

const url = computed<string | null>(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return null

  return getResourcesStaticUrl(resource)
})
</script>
