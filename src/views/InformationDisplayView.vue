<template>
  <iframe
    v-if="url"
    :src="url"
    title="Information Document"
    class="w-100 h-100 ma-0 pa-0 border-none"
    ref="iframeRef"
    :style="
      theme.current.value.dark && !themeAcknowledged
        ? { filter: 'invert(1) hue-rotate(180deg)' }
        : undefined
    "
    @load="postTheme"
  />
  <div v-else class="pa-4">
    <span>No information document configured</span>
  </div>
</template>

<script setup lang="ts">
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const theme = useTheme()
const iframeRef = ref<HTMLIFrameElement>()
const themeAcknowledged = ref(false)

function postTheme() {
  themeAcknowledged.value = false
  iframeRef.value?.contentWindow?.postMessage(
    {
      type: 'FEWS_WEB_OC:SET_THEME',
      theme: theme.current.value.dark ? 'dark' : 'light',
    },
    '*',
  )
}

function onMessage(event: MessageEvent) {
  if (event.data?.type === 'FEWS_WEB_OC:THEME_ACK') {
    themeAcknowledged.value = true
  }
}

onMounted(() => window.addEventListener('message', onMessage))
onUnmounted(() => window.removeEventListener('message', onMessage))

watch(() => theme.current.value.dark, postTheme)

const url = computed(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return

  return getResourcesStaticUrl(resource)
})
</script>
