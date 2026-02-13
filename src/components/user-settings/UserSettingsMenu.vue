<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="mdi-cog" aria-label="User Settings" />
    </template>
    <v-list density="compact">
      <template v-for="setting in store.listFavorite" :key="setting.id">
        <UserSettingsOneOfMultiple
          v-if="setting.type === 'oneOfMultiple'"
          :setting="setting"
          :model-value="setting.value"
          @update:modelValue="updateModelValue({ ...setting, value: $event })"
          :aria-label="setting.label"
        />
        <UserSettingsBoolean
          v-else-if="setting.type === 'boolean'"
          :setting="setting"
          :model-value="setting.value"
          @update:modelValue="updateModelValue({ ...setting, value: $event })"
          :aria-label="setting.label"
        />
      </template>
      <v-divider />
      <SettingsDialog :title="t('userSettings.settings')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            aria-label="All User Settings"
            role="button"
          >
            {{ t('userSettings.allSettings') }} ...
          </v-list-item>
        </template>
        <template #settings>
          <UserSettings />
        </template>
      </SettingsDialog>
      <SettingsDialog :title="t('userSettings.selectUsedPermissions')">
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            aria-label="Select Used Permissions"
            role="button"
          >
            {{ t('userSettings.selectUsedPermissions') }}
          </v-list-item>
        </template>
        <template #settings>
          <ExcludePermissions />
        </template>
      </SettingsDialog>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import {
  type UserSettingsItem,
  useUserSettingsStore,
} from '@/stores/userSettings'
import SettingsDialog from './SettingsDialog.vue'
import UserSettings from './UserSettings.vue'
import ExcludePermissions from './ExcludePermissions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const store = useUserSettingsStore()

function updateModelValue(setting: UserSettingsItem) {
  store.add(setting)
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}
</style>
