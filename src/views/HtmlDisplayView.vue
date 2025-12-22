<template>
  <HtmlDisplay class="pt-4 px-4" :url="url" />
</template>

<script setup lang="ts">
import HtmlDisplay from '@/components/general/HtmlDisplay.vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useConfigStore } from '@/stores/config'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const configStore = useConfigStore()
const url = computed(() => {
  const matchingComponent = configStore
    .getComponentsByType('HtmlDisplay')
    ?.find((c) => c.path === route.params.path)

  const componentUrl = matchingComponent?.url
  return componentUrl ? getResourcesStaticUrl(componentUrl) : componentUrl
})
</script>
