<template>
  <HtmlDisplay :url="url" />
</template>

<script setup lang="ts">
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'
import { useConfigStore } from '@/stores/config'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const configStore = useConfigStore()
const url = computed(() => {
  const matchingComponent = configStore
    .getComponentsByType('HtmlDisplay')
    ?.find((c) => c.path === route.params.path)
  console.log(matchingComponent)
  return matchingComponent?.url
})
</script>
