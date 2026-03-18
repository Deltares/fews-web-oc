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

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import EmptyLayout from './layouts/EmptyLayout.vue'

import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config.ts'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useUserSettingsStore } from './stores/userSettings'
import { useTheme } from 'vuetify'
import { useDark, usePreferredDark, useToggle } from '@vueuse/core'
import { useTaskRunMonitorStore } from './stores/taskRunMonitor'

import '@/assets/fews-flags.css'
import { useBaseMapsStore } from './stores/baseMaps'
import {
  convertBaseMapToUserSetting,
  getBaseMapsFromConfig,
} from './lib/basemap'
import { MapLayerConfig } from '@deltares/fews-pi-requests'

const route = useRoute()
const configStore = useConfigStore()
const userSettingsStore = useUserSettingsStore()
const { change } = useTheme()
const prefersDark = usePreferredDark()
const isDark = useDark()
const toggleDark = useToggle(isDark)

// Initialise task run monitoring.
useTaskRunMonitorStore()

onMounted(() => {
  updateTheme()
})

const layoutComponent = computed(() => {
  if (window.location.href.includes('/embed/')) {
    return EmptyLayout
  }

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

watch(
  () => configStore.general.mapLayerConfig,
  async () => {
    if (configStore.general.mapLayerConfig) {
      updateUserSettingBaseMaps(configStore.general.mapLayerConfig)
    }
  },
)

const settings = useUserSettingsStore()

const baseMapsStore = useBaseMapsStore()

function updateUserSettingBaseMaps(config: MapLayerConfig) {
  const baseMaps = getBaseMapsFromConfig(config)
  baseMapsStore.setBaseMaps(baseMaps)

  if (config.defaultDarkModeMapLayerId) {
    baseMapsStore.defaultDarkId = config.defaultDarkModeMapLayerId
  }

  if (config.defaultLightModeMapLayerId) {
    baseMapsStore.defaultLightId = config.defaultLightModeMapLayerId
  }

  const settingItems = baseMapsStore.allBaseMaps.map(
    convertBaseMapToUserSetting,
  )
  settings.updateSettingItems('ui.map.theme', settingItems)
}

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

function setTheme(setDark: boolean): void {
  change(setDark ? 'dark' : 'light')
  if (setDark !== isDark.value) {
    toggleDark()
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

<style>
.v-table--fixed-header > .v-table__wrapper > table > thead > tr > th {
  border-bottom: 0 !important;
  position: sticky;
  top: 0;
  z-index: 2;
}

.pointer-events-none {
  pointer-events: none;
}

:root {
  --selected-color: rgba(var(--v-theme-on-surface), var(--v-activated-opacity));
}
</style>
