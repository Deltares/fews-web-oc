<template>
  <div v-if="htmlText" class="html-content pa-4" v-html="htmlText"></div>
  <v-alert v-else class="ma-10">Resource not found</v-alert>
</template>

<script setup lang="ts">
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useConfigStore } from '@/stores/config'
import { computedAsync } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const configStore = useConfigStore()
const matchingComponent = computed(() => {
  const components = Object.values(configStore.components)
  return components.find(
    (c) => c.id === 'htmlDisplay' && c.path === route.params.path,
  )
})

const url = computed(() => matchingComponent.value?.url)
const htmlText = computedAsync(async () => {
  if (!url.value) return

  const staticUrl = getResourcesStaticUrl(url.value)

  try {
    const response = await fetch(staticUrl)
    const text = await response.text()
    if (response.ok) {
      // Remove style since this leaks into our global styles
      const textWithoutStyle = text.replaceAll(/<style>(.|\n)*<\/style>/g, '')
      return textWithoutStyle
    }
  } catch (error) {
    // Handle fetch error
  }
})
</script>

<style scoped>
.html-content {
  height: 100%;
  overflow-y: auto;
}

.html-content :deep(ul) {
  padding: revert;
}
</style>
