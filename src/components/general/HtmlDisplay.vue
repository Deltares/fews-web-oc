<template>
  <div v-if="htmlText" class="html-content" v-html="htmlText"></div>
  <v-alert v-else class="ma-10">Resource not found</v-alert>
</template>

<script setup lang="ts">
import { computedAsync } from '@vueuse/core'

interface Props {
  url: string | undefined
}

const props = defineProps<Props>()

const htmlText = computedAsync(async () => {
  if (!props.url) return

  try {
    const response = await fetch(props.url)
    const text = await response.text()
    if (response.ok) {
      // Remove style since this leaks into our global styles
      return text.replaceAll(/<style>(.|\n)*?<\/style>/g, '')
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
