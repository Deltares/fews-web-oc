<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text v-html="htmlText"></v-card-text>
  </v-card>
</template>

<script setup lang="ts">
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

const title = computed(() => matchingComponent.value?.title)
const url = computed(() => matchingComponent.value?.url)
const htmlText = computedAsync(async () => {
  if (!url.value) return

  try {
    const response = await fetch(url.value)
    const text = await response.text()
    return text
  } catch (error) {
    // Handle fetch error
  }
})
</script>
