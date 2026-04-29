<template>
  <v-menu left bottom :close-on-content-click="false" class="menu">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon="mdi-cog" aria-label="User Settings" />
    </template>
    <v-list density="compact">
      <template v-for="(setting, index) in store.listFavorite" :key="index">
        <UserSettingsOneOfMultiple
          v-if="setting.type === 'oneOfMultiple'"
          :setting="setting"
          :model-value="setting.value"
          @update:modelValue="updateModelValue({ ...setting, value: $event })"
        />
        <UserSettingsBoolean
          v-else-if="setting.type === 'boolean'"
          :setting="setting"
          :model-value="setting.value"
          @update:modelValue="updateModelValue({ ...setting, value: $event })"
        />
      </template>
      <v-divider />
      <UserSettingsDialog>
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            aria-label="All User Settings"
            role="button"
          >
            {{ t('userSettings.allSettings') }} ...
          </v-list-item>
        </template>
      </UserSettingsDialog>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import UserSettingsOneOfMultiple from './UserSettingsOneOfMultiple.vue'
import UserSettingsBoolean from './UserSettingsBoolean.vue'
import { UserSettingsItem, useUserSettingsStore } from '@/stores/userSettings'
import UserSettingsDialog from './UserSettingsDialog.vue'
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
