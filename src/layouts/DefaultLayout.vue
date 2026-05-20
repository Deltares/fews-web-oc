<template>
  <v-layout id="app">
    <v-app-bar
      :color="appBarColor"
      :style="appBarStyle"
      density="compact"
      data-test-id="app-bar"
      role="banner"
      aria-label="Application header"
    >
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        <v-btn :to="{ name: 'Default' }" v-if="!isInstalledPWA && mdAndUp">
          <img height="36px" :src="logoSrc" alt="Application Logo" />
        </v-btn>
        <div id="app-bar-content-start" />
      </template>
      <div class="h-100" id="app-bar-content-center"></div>
      <template #append>
        <div id="app-bar-content-end" />
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
      role="navigation"
      aria-label="Main navigation"
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
          <v-list-subheader>{{ $t('layout.switchTo') }}</v-list-subheader>
          <v-menu origin="bottom" width="320">
            <template #activator="{ props }">
              <v-list-item
                role="button"
                aria-label="Switch topology group"
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
      <div id="web-oc-sidebar-target" class="d-flex flex-column flex-1-1"></div>
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
                <v-list-item :to="{ name: 'About' }">{{
                  $t('layout.about')
                }}</v-list-item>
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
      <v-sheet class="w-100 h-100 d-flex flex-row">
        <div class="flex-1-1 overflow-hidden">
          <Suspense>
            <router-view></router-view>
          </Suspense>
        </div>
        <div class="border-s h-100" id="main-side-panel" />
      </v-sheet>
      <StartupDialog />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, type StyleValue, watch } from 'vue'
import { useDisplay, useRtl, useTheme } from 'vuetify'
import { useConfigStore } from '../stores/config.ts'
import { useRoute } from 'vue-router'
import LoginComponent from '../views/auth/LoginComponent.vue'
import UserSettingsMenu from '../components/user-settings/UserSettingsMenu.vue'
import TimeControlMenu from '../components/time-control/TimeControlMenu.vue'
import StartupDialog from '@/components/dialog/StartupDialog.vue'

import { configManager } from '@/services/application-config'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import packageConfig from '@/../package.json'
import { toCharacterIcon } from '@/lib/icons/index.ts'
import { useUserSettingsStore } from '@/stores/userSettings.ts'
import { useCustomStyleSheet } from '@/services/useCustomStyleSheet/index.ts'

const configStore = useConfigStore()
const settings = useUserSettingsStore()
const { mobile, mdAndUp } = useDisplay()

const theme = useTheme()

const drawer = ref(true)
const { isRtl } = useRtl()
const route = useRoute()

const isInstalledPWA = globalThis.matchMedia(
  '(display-mode: standalone)',
).matches

const showHash = ref(false)
const appBarStyle = ref<StyleValue>()
const appBarColor = ref<string>('')

function updateAppBarStyles() {
  appBarColor.value = getComputedStyle(document.body).getPropertyValue(
    '--weboc-app-bar-bg-color',
  )
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', appBarColor.value)
  }

  appBarStyle.value = {
    backgroundImage: 'var(--weboc-app-bar-bg-image)',
    backgroundSize: 'cover',
  }
}

watch(
  () => theme.global.current.value,
  () => {
    nextTick(updateAppBarStyles)
  },
)

useCustomStyleSheet({ onload: updateAppBarStyles })

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

#web-oc-toolbar-target:empty {
  display: none !important;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering)
  .v-navigation-drawer__content {
  overflow-y: hidden;
}
</style>
