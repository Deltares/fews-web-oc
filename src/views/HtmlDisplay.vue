<template>
  <div class="html-content pa-4" v-html="htmlText"></div>
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
    return text
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

.html-content >>> ul {
  padding: revert;
}
</style>
