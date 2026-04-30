<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-share-variant" />
    </template>

    <v-card min-width="400" density="compact">
      <v-card-text>
        <CopyUrlField :url="embedUrl" />

        <v-sheet border rounded class="mt-4">
          <v-tabs v-model="tab" grow>
            <v-tab value="user-settings" class="text-none">User settings</v-tab>
            <v-tab value="component-settings" class="text-none"
              >Component settings</v-tab
            >
          </v-tabs>

          <v-list density="compact" class="py-0">
            <v-list-group v-for="group in store.groups" :key="group.id">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="group.title"
                  :prepend-icon="group.icon"
                />
              </template>

              <template
                v-for="setting in store.listByGroup(group.id)"
                :key="setting.id"
              >
                <UserSettingsOneOfMultiple
                  v-if="setting.type === 'oneOfMultiple'"
                  :setting="setting"
                  :model-value="setting.value"
                  inline
                />

                <UserSettingsBoolean
                  v-else-if="setting.type === 'boolean'"
                  :setting="setting"
                  :model-value="setting.value"
                  inline
                />
              </template>
            </v-list-group>
          </v-list>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts" setup>
import CopyUrlField from './CopyUrlField.vue'
import { useRoute } from 'vue-router'

import UserSettingsBoolean from '@/components/user-settings/UserSettingsBoolean.vue'
import UserSettingsOneOfMultiple from '@/components/user-settings/UserSettingsOneOfMultiple.vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { computed, ref } from 'vue'

const route = useRoute()
const store = useUserSettingsStore()

const tab = ref('user-settings')

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

<style scoped>
:deep(.v-list-group__items .v-list-item) {
  --indent-padding: 0px;
}
</style>
