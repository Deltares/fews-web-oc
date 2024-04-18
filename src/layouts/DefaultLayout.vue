<template>
  <v-layout id="app">
    <v-navigation-drawer
      v-model="drawer"
      :location="isRtl ? 'right' : 'left'"
      width="320"
      class="view-sidebar"
    >
      <template v-slot:prepend>
        <v-toolbar density="compact" fixed>
          <v-btn variant="text" :to="{ name: 'Default' }">
            <img height="36" :src="logoSrc" />
          </v-btn>
          <v-spacer />
          <login-component v-if="configManager.authenticationIsEnabled" />
        </v-toolbar>
        <v-menu
          origin="left"
          min-width="320"
          v-if="configStore.activeComponents.length > 1"
        >
          <template #activator="{ isActive, props }">
            <v-list-item
              aria-label="Menu button"
              v-bind="props"
              class="ma-1"
              rounded
              variant="tonal"
            >
              <v-list-item-title>{{ currentItem }}</v-list-item-title>
              <template #append>
                <v-icon
                  :icon="isActive ? 'mdi-chevron-right' : 'mdi-chevron-right'"
                ></v-icon>
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
        <v-list density="compact" v-if="shouldRenderInfoMenu">
          <v-list-item
            aria-label="Menu button"
            class="ma-1"
            rounded
            variant="tonal"
            :value="configStore.activeComponents[0]"
            :to="configStore.activeComponents[0].to"
          >
            <template v-slot:prepend>
              <v-icon :icon="configStore.activeComponents[0].icon"></v-icon>
            </template>
            <v-list-item-title
              v-text="configStore.activeComponents[0].title"
            ></v-list-item-title>
          </v-list-item>
        </v-list>
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
    <v-app-bar :color="appBarColor" :style="appBarStyle" density="compact">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <div id="app-bar-content"></div>
      <v-spacer />
      <time-control-menu></time-control-menu>
      <user-settings-menu />
    </v-app-bar>
    <v-main id="main">
      <Suspense>
        <router-view></router-view>
      </Suspense>
      <div class="alert-container" v-if="alertsStore.hasActiveAlerts">
        <v-alert
          v-for="alert in alertsStore.activeAlerts"
          color="error"
          icon="mdi-alert"
          closable
          @click:close="onCloseAlert(alert)"
        >
          {{ alert.message }}
        </v-alert>
      </div>
      <SplashScreen v-if="splashSrc" :img-url="splashSrc" :version="version" />
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
import SplashScreen from '@/components/general/SplashScreen.vue'

import { configManager } from '@/services/application-config'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { StyleValue, nextTick } from 'vue'
import packageConfig from '../../package.json'

const configStore = useConfigStore()
const alertsStore = useAlertsStore()
const theme = useTheme()

const drawer = ref(true)
const currentItem = ref('')
const { isRtl } = useRtl()
const route = useRoute()

const version = ref(packageConfig.version)
const showHash = ref(false)
const logoSrc = ref('')
const splashSrc = ref<string>()
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
    const logoUrl = await getLocalOrRemoteFile(
      imagesBaseUrl,
      configStore.general.icons?.logo,
    )
    logoSrc.value = logoUrl ?? defaultLogo

    splashSrc.value = await getLocalOrRemoteFile(
      imagesBaseUrl,
      configStore.general.splashScreen,
    )
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
  if (configStore.activeComponents.length > 1) return false
  if (helpMenu.value === undefined) return false
  const paths = helpMenu.value.path.map((item: any) => item.path)
  paths.push('about')
  const path = route.path.substring(route.path.lastIndexOf('/') + 1)
  return paths.includes(path)
})

async function getLocalOrRemoteFile(localBase: string, relativePath?: string) {
  if (!relativePath) return
  const remoteUrl = getResourcesStaticUrl(relativePath)
  const localUrl = `${localBase}${relativePath}`

  const isHtmlResponse = (response: Response) => {
    const contentType = response.headers.get('Content-Type')
    return contentType?.includes('text/html') ?? false
  }

  try {
    const remoteResponse = await fetch(remoteUrl, { method: 'HEAD' })
    if (remoteResponse.ok && !isHtmlResponse(remoteResponse)) {
      return remoteUrl
    }
  } catch (error) {
    // Handle fetch error
  }

  try {
    const localResponse = await fetch(localUrl, { method: 'HEAD' })
    if (localResponse.ok && !isHtmlResponse(localResponse)) {
      return localUrl
    }
  } catch (error) {
    // Handle fetch error
  }
}

function onCloseAlert(alert: Alert) {
  alert.active = false
}
</script>

<style>
html,
body {
  margin: 0px;
  overflow: hidden !important;
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
</style>
