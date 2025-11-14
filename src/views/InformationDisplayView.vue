<template>
  <iframe
    v-if="url"
    :src="url"
    class="w-100 h-100 ma-0 pa-0 border-none"
    ref="frame"
  />
  <div v-else class="pa-4">
    <span>No information document configured</span>
  </div>
</template>

<script setup lang="ts">
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { useDark } from '@vueuse/core'
import { computed, useTemplateRef, watchEffect } from 'vue'
const isDark = useDark()

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()
const frameRef = useTemplateRef('frame')

const url = computed(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return

  return getResourcesStaticUrl(resource)
})

watchEffect(
  () => {
    updateIframeClass(isDark.value)
  },
)

function updateIframeClass(isDark: boolean) {
  const iframe = frameRef.value
  if (!iframe || !isSameOrigin(iframe)) return

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  if (isDark) {
    doc.documentElement.classList.add('dark')
  } else {
    doc.documentElement.classList.remove('dark')
  }
}

function isSameOrigin(iframe: HTMLIFrameElement): boolean {
  try {
    // Simply accessing location.href will throw a SecurityError if cross-origin
    iframe.contentWindow?.location.href
    return true // success → same-origin
  } catch (e) {
    return false // error → cross-origin
  }
}
</script>
