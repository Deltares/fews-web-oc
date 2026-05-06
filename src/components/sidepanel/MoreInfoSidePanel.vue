<template>
  <SidePanelContent :title="t('sidePanel.documentFile')" @close="emit('close')">
    <template #prepend>
      <v-btn icon="mdi-home" @click="goHome" />
    </template>

    <iframe
      ref="frame"
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
import { computed, useTemplateRef } from 'vue'
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

const frame = useTemplateRef('frame')

const url = computed<string | null>(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return null

  return getResourcesStaticUrl(resource)
})

function goHome(): void {
  if (frame.value === null || url.value === null) return
  // When navigating with links in an iframe, the "src" attribute will not
  // change. We remove the src attribute and set it again to navigate back to
  // the home page.
  frame.value.removeAttribute('src')
  frame.value.src = url.value
}
</script>
