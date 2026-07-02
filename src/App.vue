<template>
  <Suspense>
    <template #default>
      <component style="height: 100%" :is="layoutComponent"></component>
    </template>
    <template #fallback>
      <span>Loading...</span>
    </template>
  </Suspense>
  <Alerts />
</template>

<script setup lang="ts">
import { computed, onMounted, watch, watchEffect } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import EmptyLayout from './layouts/EmptyLayout.vue'
import Alerts from '@/components/general/Alerts.vue'

import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config.ts'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useUserSettingsStore } from './stores/userSettings'
import { useTheme } from 'vuetify'
import { useDark, usePreferredDark } from '@vueuse/core'
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
const { change: changeTheme } = useTheme()
const prefersDark = usePreferredDark()
const isDark = useDark()

// Initialise task run monitoring.
useTaskRunMonitorStore()

onMounted(() => {
  userSettingsStore.initializeWithWebResources()
})

const layoutComponent = computed(() => {
  if (globalThis.location.href.includes('/embed/')) {
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

watchEffect(() => {
  const themeSetting = userSettingsStore.get('ui.theme')?.value
  if (typeof themeSetting !== 'string') return

  if (themeSetting === 'auto') {
    setTheme(prefersDark.value)
  } else {
    setTheme(themeSetting === 'dark')
  }
})

function setTheme(setDark: boolean): void {
  changeTheme(setDark ? 'dark' : 'light')
  if (setDark !== isDark.value) {
    isDark.value = setDark
  }
}
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
