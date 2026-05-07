<template>
  <div class="pa-4 h-100 overflow-auto">
    <CopyUrlField :url="embedUrl" />

    <v-card flat border class="my-4">
      <v-toolbar density="compact">
        <div class="ms-4">Settings</div>
      </v-toolbar>
      <v-divider />

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
            v-for="setting in getSettingsByGroup(group.id)"
            :key="setting.id"
          >
            <UserSettingsOneOfMultiple
              v-if="setting.type === 'oneOfMultiple'"
              v-model="setting.value"
              :setting="setting"
              inline
            />

            <UserSettingsBoolean
              v-else-if="setting.type === 'boolean'"
              v-model="setting.value"
              :setting="setting"
              inline
            />
          </template>
        </v-list-group>
      </v-list>
    </v-card>
  </div>
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

const settings = ref(store.items.map((item) => ({ ...item })))

function getSettingsByGroup(groupId: string) {
  return settings.value.filter((s) => s.group === groupId)
}

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

  const params = url.searchParams

  settings.value.forEach((setting) => {
    if (setting.type === 'boolean') {
      params.set(setting.id, setting.value ? 'true' : 'false')
    } else if (setting.type === 'oneOfMultiple') {
      params.set(setting.id, setting.value)
    }
  })

  return url.toString()
})
</script>

<style scoped>
:deep(.v-list-group__items .v-list-item) {
  --indent-padding: 0px;
}
</style>
