<template>
  <v-card min-width="400" density="compact">
    <v-card-text>
      <CopyUrlField :url="embedUrl" />

      <v-sheet border rounded class="mt-4">
        <v-tabs v-model="tab" grow>
          <v-tab value="user-settings" class="text-none">User settings</v-tab>
          <v-tab value="component-settings" class="text-none">
            Component settings
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="user-settings">
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
          </v-tabs-window-item>

          <v-tabs-window-item value="component-settings">
            <v-card-text class="text-center">
              <p class="mb-2">Component settings are not supported yet.</p>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-sheet>
    </v-card-text>
  </v-card>
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

  // Example of getting these params using vue router
  // const route = useRoute()
  // const mySettingValue = route.query['my-setting-id']
  // You can also parse boolean values if needed
  // const mySettingBoolean = mySettingValue === 'true'
  // This way you can apply the settings when the component is created based on the URL params

  return url.toString()
})
</script>

<style scoped>
:deep(.v-list-group__items .v-list-item) {
  --indent-padding: 0px;
}
</style>
