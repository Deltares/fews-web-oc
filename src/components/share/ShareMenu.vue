<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-share-variant" />
    </template>

    <v-card :title="t('share.title')" min-width="400" density="compact">
      <v-divider />
      <v-card-text>
        <v-list
          v-for="group in groups"
          :key="group"
          class="mb-2"
          density="compact"
        >
          <v-list-subheader>{{ group }}</v-list-subheader>
          <template
            v-for="setting in store.listByGroup(group)"
            :key="setting.id"
          >
            <UserSettingsOneOfMultiple
              v-if="setting.type === 'oneOfMultiple'"
              :setting="setting"
              :model-value="setting.value"
              :aria-label="`${group} ${setting.label}`"
              inline
            />

            <UserSettingsBoolean
              v-else-if="setting.type === 'boolean'"
              :setting="setting"
              :model-value="setting.value"
              :aria-label="`${group} ${setting.label}`"
              inline
            />
          </template>
        </v-list>

        <CopyUrlField :url="embedUrl" />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
import CopyUrlField from './CopyUrlField.vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import UserSettingsBoolean from '@/components/user-settings/UserSettingsBoolean.vue'
import UserSettingsOneOfMultiple from '@/components/user-settings/UserSettingsOneOfMultiple.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { computed } from 'vue'

const { t } = useI18n()

const route = useRoute()
const store = useUserSettingsStore()
const groups = computed(() => store.listGroups)

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
