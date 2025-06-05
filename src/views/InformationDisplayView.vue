<template>
  <div class="d-flex h-100 w-100 flex-column">
    <v-toolbar density="compact" class="flex-0-0 px-2">
      Information
      <template #append>
        <v-btn @click="onClose" size="small" variant="text" icon="mdi-close" />
      </template>
    </v-toolbar>
    <v-sheet class="flex-1-1">
      <iframe :src="url" class="w-100 h-100 ma-0 pa-0 border-none" />
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
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
