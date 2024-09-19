<template>
  <div class="d-flex h-100 w-100 flex-column">
    <v-toolbar density="compact" title="Information" class="flex-0-0">
      <template #append>
        <v-btn @click="onClose" size="small" variant="text" icon="mdi-close" />
      </template>
    </v-toolbar>
    <v-sheet style="overflow-y: auto">
      <HtmlDisplay :url />
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

function onClose() {
  emit('close')
}

const url = computed(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return

  return getResourcesStaticUrl(resource)
})
</script>
