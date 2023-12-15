<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import EmptyLayout from './layouts/EmptyLayout.vue'

import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config.ts'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useUserSettingsStore } from './stores/userSettings'
import { useTheme } from 'vuetify'
import { usePreferredDark } from '@vueuse/core'

import '@/assets/fews-flags.css'

const route = useRoute()
const configStore = useConfigStore()
const userSettingsStore = useUserSettingsStore()
const theme = useTheme()
const prefersDark = usePreferredDark()

onMounted(() => {
  updateTheme()
})

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

watch(prefersDark, () => updateTheme())

function updateTheme(theme?: string) {
  const themeSetting = theme ? theme : userSettingsStore.get('ui.theme')?.value
  if (typeof themeSetting === 'string') {
    if (themeSetting === 'auto') {
      setTheme(prefersDark.value)
    } else {
      setTheme(themeSetting === 'dark')
    }
  }
}

function setTheme(isDark: boolean): void {
  theme.global.name.value = isDark ? 'dark' : 'light'
  // Update wb-charts stylesheet such that charts also change to the selected theme.
  const css = document.getElementById('theme_css') as HTMLLinkElement
  if (css) {
    css.href = isDark
      ? `${import.meta.env.BASE_URL}wb-charts-dark.css`
      : `${import.meta.env.BASE_URL}wb-charts-light.css`
  }
}

userSettingsStore.$onAction(({ name, args }) => {
  if (name === 'add') {
    const item = args[0]
    switch (item.id) {
      case 'ui.theme':
        updateTheme(item.value as string)
        break
      default:
    }
  }
})
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

<style>
.wb-charts,
.tooltip {
  font-size: 0.75rem;
}

.v-table--fixed-header > .v-table__wrapper > table > thead > tr > th {
  border-bottom: 0 !important;
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
