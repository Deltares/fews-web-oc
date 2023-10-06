<script setup lang="ts">
import { computed, watch } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import EmptyLayout from './layouts/EmptyLayout.vue'

import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config.ts'
import { getResourcesStaticUrl } from '@/lib/fews-config'

const route = useRoute()
const configStore = useConfigStore()

const layoutComponent = computed(() => {
  switch (route.meta.layout) {
    case 'EmptyLayout':
      return EmptyLayout
    default:
      return DefaultLayout
  }
})

watch(
  () => configStore.general.title,
  () => {
    document.title = configStore.general.title ?? 'Delft-FEWS Web OC'
  },
)

watch(
  () => configStore.general.icons,
  (icons) => {
    if (icons && icons.favicon) {
      const faviconUrl: string = getResourcesStaticUrl(icons.favicon).toString()
      const currentFavicon = document.querySelector("link[rel='icon']")
      currentFavicon?.setAttribute('href', faviconUrl.toString())
    }
  },
)
</script>

<template>
  <Suspense>
    <template #default>
      <component style="height: 100%" :is="layoutComponent"></component>
    </template>
    <template #fallback>
      <span>Loading...</span>
    </template>
  </Suspense>
</template>

<style scoped></style>
