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
        <time-control-menu />
        <user-settings-menu />
        <login-component v-if="configManager.authenticationIsEnabled" />
      </template>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :location="isRtl ? 'right' : 'left'"
      width="320"
      class="view-sidebar"
      expand-on-hover
      rail
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
        <v-menu
          origin="left"
          min-width="320"
          v-else-if="configStore.activeComponents.length > 1"
        >
          <template #activator="{ props }">
            <v-list-item
              aria-label="Menu button"
              v-bind="props"
              class="ma-1"
              rounded
              variant="tonal"
            >
              <v-list-item-title>{{ currentItem }}</v-list-item-title>
              <template #append>
                <v-icon>mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list density="compact">
            <v-list-subheader>Switch to</v-list-subheader>
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
        <div class="d-flex align-center text-caption text-medium-emphasis pa-2">
          <v-btn
            variant="tonal"
            prepend-icon="mdi-help-circle-outline"
            class="text-capitalize"
          >
            Info
            <v-menu
              location="top"
              activator="parent"
              :transition="false"
              :close-on-content-click="true"
              width="320"
            >
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
          </v-btn>
          <v-spacer />
          <v-btn
            variant="plain"
            class="text-lowercase"
            size="small"
            @click="showHash = !showHash"
            :prepend-icon="showHash ? 'mdi-source-commit' : 'mdi-tag-outline'"
            >{{ versionString }}</v-btn
          >
        </div>
      </template>
    </v-navigation-drawer>
    <v-main id="main">
      <Suspense>
        <router-view></router-view>
      </Suspense>
      <div class="alerts__container" v-if="alertsStore.hasActiveAlerts">
        <v-alert
          v-for="alert in alertsStore.activeAlerts"
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
import { computed, ref, watch, watchEffect } from 'vue'
import { useRtl, useTheme } from 'vuetify'
import { useConfigStore } from '../stores/config.ts'
import { Alert, useAlertsStore } from '../stores/alerts.ts'
import { useRoute } from 'vue-router'
import LoginComponent from '../views/auth/LoginComponent.vue'
import UserSettingsMenu from '../components/user-settings/UserSettingsMenu.vue'
import TimeControlMenu from '../components/time-control/TimeControlMenu.vue'
import StartupDialog from '@/components/dialog/StartupDialog.vue'
import GlobalSearchComponent from '@/components/general/GlobalSearchComponent.vue'

import { configManager } from '@/services/application-config'
import { getLocalOrRemoteFileUrl } from '@/lib/fews-config'
import { StyleValue, nextTick } from 'vue'
import packageConfig from '@/../package.json'

const configStore = useConfigStore()
const alertsStore = useAlertsStore()
const theme = useTheme()

const drawer = ref(true)
const currentItem = ref('')
const { isRtl } = useRtl()
const route = useRoute()

const showHash = ref(false)
const logoSrc = ref('')
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
      link.href = configStore.customStyleSheet
      link.onload = () => {
        appBarStyle.value = {
          backgroundImage: 'var(--weboc-app-bar-bg-image)',
          backgroundSize: 'cover',
        }
        updateAppBarColor()
      }
      document.head.appendChild(link)
    }
  },
)

watchEffect(async () => {
  const parentRoute = route.matched[0]
  if (parentRoute !== undefined) {
    const parentRouteName = parentRoute.name?.toString() ?? ''
    const activeComponent = configStore.getComponentByType(parentRouteName)
    const routeName =
      activeComponent?.title || (parentRoute.meta?.title as string)
    currentItem.value = routeName
  } else {
    currentItem.value = ''
  }
})

watch(
  () => configStore.general,
  async () => {
    const imagesBaseUrl = `${import.meta.env.BASE_URL}images/`
    const defaultLogo = `${imagesBaseUrl}logo.png`
    if (configStore.general.icons?.logo === undefined) {
      logoSrc.value = defaultLogo
      return
    }
    const logoUrl = await getLocalOrRemoteFileUrl(
      imagesBaseUrl,
      configStore.general.icons?.logo,
    )
    logoSrc.value = logoUrl ?? defaultLogo
  },
)

const versionString = computed(() => {
  if (showHash.value && !__GIT_TAG__) {
    return __GIT_HASH__
  }
  return packageConfig.version
})

const helpMenu = computed(() => {
  if ('helpMenu' in (configStore.general as any)) {
    return (configStore.general as any).helpMenu
  } // todo: add type when fews-pi-requests is updated
})

const shouldRenderInfoMenu = computed(() => {
  const currentRoute = route.matched[0]
  if (currentRoute === undefined) return false
  return !currentRoute.meta?.sidebar
})

function onCloseAlert(alert: Alert) {
  alertsStore.deactiveAlert(alert.id)
}
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

.router-container {
  padding: 0px;
  height: 100%;
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
</style>
