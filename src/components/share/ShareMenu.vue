<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-share-variant" />
    </template>

    <v-card :title="t('share.title')" min-width="400" density="compact">
      <v-divider />
      <v-card-text>
        <v-list density="compact">
          <v-list-item density="compact" :title="t('share.dark')">
            <template #prepend>
              <v-list-item-action start>
                <v-checkbox-btn />
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
        <CopyUrlField :url="embedUrl" />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
import CopyUrlField from './CopyUrlField.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const route = useRoute()

const embedUrl = computed(() => {
  const url = new URL(window.location.href)
  // Insert '/embed' after the base path (route.matched[0].path)
  const basePath = route.matched[0]?.path || ''
  if (url.pathname.startsWith(basePath)) {
    url.pathname =
      basePath.replace(/\/$/, '') +
      '/embed' +
      url.pathname.slice(basePath.length)
  } else {
    url.pathname = '/embed' + url.pathname
  }
  return url.toString()
})
</script>
