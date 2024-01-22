<template>
  <v-layout id="app">
    <v-navigation-drawer
      v-model="drawer"
      :location="isRtl ? 'right' : 'left'"
      width="320"
      class="view-sidebar"
    >
      <v-toolbar density="compact" fixed>
        <v-btn variant="text" :to="{ name: 'Default' }">
          <img height="36" :src="logoSrc" />
        </v-btn>
        <v-spacer />
        <login-component v-if="configManager.authenticationIsEnabled" />
      </v-toolbar>
      <v-menu origin="left" min-width="320">
        <template #activator="{ isActive, props }">
          <v-list-item aria-label="Menu button" v-bind="props">
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
      <div id="web-oc-sidebar-target"></div>
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
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'
import { useRtl } from 'vuetify'
import { useConfigStore } from '../stores/config.ts'
import { Alert, useAlertsStore } from '../stores/alerts.ts'
import { useRoute } from 'vue-router'
import LoginComponent from '../views/auth/LoginComponent.vue'
import UserSettingsMenu from '../components/user-settings/UserSettingsMenu.vue'
import TimeControlMenu from '../components/time-control/TimeControlMenu.vue'

import { configManager } from '@/services/application-config'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { StyleValue } from 'vue'

const configStore = useConfigStore()
const alertsStore = useAlertsStore()

const drawer = ref(true)
const currentItem = ref('')
const { isRtl } = useRtl()
const route = useRoute()

const logoSrc = ref('')
const appBarStyle = ref<StyleValue>()
const appBarColor = ref<string>('')

watch(
  () => configStore.general,
  async () => {
    const css = document.getElementById('custom-style-sheet') as HTMLLinkElement
    if (css) {
      css.href = configStore.customStyleSheet
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
        appBarColor.value = getComputedStyle(document.body).getPropertyValue(
          '--weboc-app-bar-bg-color',
        )
      }
      document.head.appendChild(link)
    }
  },
)

watchEffect(async () => {
  const parentRoute = route.matched[0]
  const parentRouteName =
    parentRoute !== undefined ? parentRoute.name?.toString() ?? '' : ''
  const activeComponent = configStore.getComponentByType(parentRouteName)
  const routeName = activeComponent?.title ?? parentRouteName
  currentItem.value = routeName
})

watch(() => configStore.general, setLogo)

async function setLogo() {
  const defaultLogo = `${import.meta.env.BASE_URL}images/logo.png`
  const logoRelPath = configStore.general.icons?.logo

  if (logoRelPath) {
    const remoteUrl = getResourcesStaticUrl(logoRelPath)
    const localUrl = `${import.meta.env.BASE_URL}images/${logoRelPath}`

    try {
      const remoteResponse = await fetch(remoteUrl, { method: 'HEAD' })
      if (remoteResponse.ok) {
        logoSrc.value = remoteUrl
        return
      }
    } catch (error) {
      // Handle fetch error
    }

    try {
      const localResponse = await fetch(localUrl, { method: 'HEAD' })
      if (localResponse.ok) {
        logoSrc.value = localUrl
        return
      }
    } catch (error) {
      // Handle fetch error
    }
  }

  logoSrc.value = defaultLogo
}

function onCloseAlert(alert: Alert) {
  alert.active = false
}
</script>

<style>
html,
body {
  margin: 0px;
  overflow: hidden;
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
