<template>
  <v-layout id="app">
    <v-app-bar :color="appBarColor" :style="appBarStyle" density="compact">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        <v-btn :to="{ name: 'Default' }">
          <img height="36" :src="logoSrc" />
        </v-btn>
        <div id="app-bar-content-start" />
      </template>
      <div class="h-100" id="app-bar-content-center"></div>
      <template #append>
        <div id="app-bar-content-end" />
        <TaskRunsControl v-if="showTaskMenu" />
        <TimeControlMenu />
        <UserSettingsMenu />
        <LoginComponent v-if="configManager.authenticationIsEnabled" />
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :location="isRtl ? 'right' : 'left'"
      width="320"
      class="view-sidebar"
      expand-on-hover
      :rail="useRail"
      onmouseover=""
    >
      <template v-slot:prepend>
        <v-list density="compact" v-if="shouldRenderInfoMenu">
          <v-list-item
            v-for="(item, i) in configStore.activeComponents"
            :key="i"
            :value="item"
            :to="item.to"
          >
            <template v-slot:prepend>
              <v-icon :icon="item.icon"></v-icon>
            </template>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item>
        </v-list>
        <v-list
          v-else-if="configStore.activeComponents.length > 1"
          density="compact"
        >
          <v-list-subheader>Switch to</v-list-subheader>
          <v-menu origin="bottom" width="320">
            <template #activator="{ props }">
              <v-list-item
                aria-label="Menu button"
                v-bind="props"
                :title="currentItemTitle"
                class="ma-2 mb-1 px-2"
                :prepend-icon="
                  activeComponent?.icon ?? toCharacterIcon(currentItemTitle)
                "
                append-icon="mdi-chevron-right"
                rounded
                variant="tonal"
              />
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="(item, i) in configStore.activeComponents"
                :key="i"
                :value="item"
                :to="item.to"
              >
                <template v-slot:prepend>
                  <v-icon :icon="item.icon"></v-icon>
                </template>
                <v-list-item-title v-text="item.title"></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list>
        <div
          class="d-flex pa-2 bg-surface-light"
          id="web-oc-toolbar-target"
        ></div>
      </template>
      <div
        id="web-oc-sidebar-target"
        class="d-flex"
        style="flex-direction: column; flex: 1 1 auto"
      ></div>
      <template v-slot:append>
        <v-divider></v-divider>
        <v-list-item>
          <template #prepend>
            <v-menu
              location="top"
              activator="parent"
              :transition="false"
              :close-on-content-click="true"
              width="320"
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="24"
                  class="me-4"
                  icon="mdi-help-circle-outline"
                />
              </template>
              <v-list density="compact">
                <v-list-item
                  v-if="helpMenu"
                  v-for="item in helpMenu.url"
                  :href="item.url"
                  target="_blank"
                  append-icon="mdi-open-in-new"
                  >{{ item.name }}</v-list-item
                >
                <v-list-item
                  v-if="helpMenu"
                  v-for="item in helpMenu.path"
                  :to="{ name: 'HtmlDisplay', params: { path: item.path } }"
                  href="#"
                  >{{ item.name }}</v-list-item
                >
                <v-list-item :to="{ name: 'About' }">About</v-list-item>
              </v-list>
            </v-menu>
          </template>
          <template #append>
            <v-btn
              class="text-lowercase"
              size="small"
              @click="showHash = !showHash"
              :prepend-icon="showHash ? 'mdi-source-commit' : 'mdi-tag-outline'"
              >{{ versionString }}</v-btn
            >
          </template>
        </v-list-item>
      </template>
    </v-navigation-drawer>
    <v-main id="main">
      <div class="w-100 h-100 d-flex flex-row">
        <div class="border-s flex-0-0 h-100" id="main-side-panel-left"></div>
        <div class="flex-1-1 overflow-hidden">
          <Suspense>
            <router-view></router-view>
          </Suspense>
        </div>
        <div class="border-s flex-0-0 h-100" id="main-side-panel-right"></div>
      </div>
      <div class="alerts__container" v-if="alertsStore.hasAlerts">
        <v-alert
          v-for="alert in alertsStore.alerts"
          :type="alert.type"
          closable
          density="compact"
          @click:close="onCloseAlert(alert)"
        >
          {{ alert.message }}
        </v-alert>
      </div>
      <StartupDialog />
      <GlobalSearchComponent />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay, useRtl, useTheme } from 'vuetify'
import { useConfigStore } from '../stores/config.ts'
import { Alert, useAlertsStore } from '../stores/alerts.ts'
import { useRoute } from 'vue-router'
import LoginComponent from '../views/auth/LoginComponent.vue'
import UserSettingsMenu from '../components/user-settings/UserSettingsMenu.vue'
import TimeControlMenu from '../components/time-control/TimeControlMenu.vue'
import StartupDialog from '@/components/dialog/StartupDialog.vue'
import GlobalSearchComponent from '@/components/general/GlobalSearchComponent.vue'
import TaskRunsControl from '@/components/tasks/TaskRunsControl.vue'

import { configManager } from '@/services/application-config'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { StyleValue, nextTick } from 'vue'
import packageConfig from '@/../package.json'
import { useUserSettingsStore } from '@/stores/userSettings.ts'
import { toCharacterIcon } from '@/lib/icons/index.ts'
import {
  convertBaseMapToUserSetting,
  getBaseMapsFromConfig,
} from '@/lib/basemap/index.ts'
import type { MapLayerConfig } from '@deltares/fews-pi-requests'
import { useBaseMapsStore } from '@/stores/baseMaps.ts'

const configStore = useConfigStore()
const settings = useUserSettingsStore()
const { mobile } = useDisplay()
const alertsStore = useAlertsStore()

const theme = useTheme()

const drawer = ref(true)
const { isRtl } = useRtl()
const route = useRoute()

const showHash = ref(false)
const appBarStyle = ref<StyleValue>()
const appBarColor = ref<string>('')

function updateAppBarColor() {
  appBarColor.value = getComputedStyle(document.body).getPropertyValue(
    '--weboc-app-bar-bg-color',
  )
}

watch(
  () => theme.global.current.value,
  () => {
    nextTick(updateAppBarColor)
  },
)

watch(
  () => configStore.general,
  async () => {
    const css = document.getElementById('custom-style-sheet') as HTMLLinkElement
    if (css !== null) {
      updateAppBarColor()
    } else {
      const link = document.createElement('link')
      link.id = 'custom-style-sheet'
      link.rel = 'stylesheet'
      link.href = await configStore.getCustomStyleSheet()
      link.onload = () => {
        appBarStyle.value = {
          backgroundImage: 'var(--weboc-app-bar-bg-image)',
          backgroundSize: 'cover',
        }
        updateAppBarColor()
      }
      document.head.appendChild(link)
    }
    if (configStore.general.mapLayerConfig) {
      updateUserSettingBaseMaps(configStore.general.mapLayerConfig)
    }
  },
)

const baseMapsStore = useBaseMapsStore()

function updateUserSettingBaseMaps(config: MapLayerConfig) {
  const baseMaps = getBaseMapsFromConfig(config)
  baseMapsStore.setBaseMaps(baseMaps)

  const settingItems = baseMapsStore.allBaseMaps.map(
    convertBaseMapToUserSetting,
  )
  settings.updateSettingItems('ui.map.theme', settingItems)
}

const activeComponent = computed(() => configStore.getComponentByRoute(route))
const currentItemTitle = computed(
  () =>
    activeComponent.value?.title ??
    (route.matched[0]?.meta?.title as string | undefined) ??
    '',
)

const logoSrc = computed(() => {
  const imagesBaseUrl = `${import.meta.env.BASE_URL}images/`
  const defaultLogo = `${imagesBaseUrl}logo.png`

  return configStore.general.icons?.logo
    ? getResourcesStaticUrl(configStore.general.icons.logo)
    : defaultLogo
})

const versionString = computed(() => {
  if (showHash.value && !__GIT_TAG__) {
    return __GIT_HASH__
  }
  return packageConfig.version
})

const helpMenu = computed(() => configStore.general.helpMenu)

const shouldRenderInfoMenu = computed(() => {
  const currentRoute = route.matched[0]
  if (currentRoute === undefined) return false
  return !currentRoute.meta?.sidebar
})

const showTaskMenu = computed(() => configStore.general.taskMenu?.enabled)

function onCloseAlert(alert: Alert) {
  alertsStore.removeAlert(alert.id)
}

const useRail = computed(
  () => settings.get('ui.sidebar-style')?.value === 'minimal' && !mobile.value,
)
</script>

<style>
html,
body {
  margin: 0px;
  overflow-y: auto !important;
  height: 100%;
}

#app {
  height: 100%;
  overflow: hidden;
}

.alert-container {
  position: absolute;
  margin: 0 auto;
  width: 80%;
  max-width: 100vw;
  bottom: 0px;
  right: 10%;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

#web-oc-toolbar-target:empty {
  display: none !important;
}

.alerts__container {
  position: absolute;
  width: 500px;
  max-width: 100%;
  bottom: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .v-navigation-drawer__content {
  overflow-y: hidden;
}
</style>
