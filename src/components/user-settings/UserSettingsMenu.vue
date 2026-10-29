<template>
  <v-menu
    v-model="menu"
    left
    bottom
    :close-on-content-click="false"
    class="menu"
  >
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
          :aria-label="label(setting)"
        />
        <UserSettingsBoolean
          v-else-if="setting.type === 'boolean'"
          :setting="setting"
          :model-value="setting.value"
          @update:modelValue="updateModelValue({ ...setting, value: $event })"
          :aria-label="label(setting)"
        />
      </template>
      <v-divider />
      <v-btn
        variant="text"
        class="w-100 justify-start"
        @click="openAllSettings"
      >
        {{ t('userSettings.allSettings') }} ...
      </v-btn>
    </v-list>
  </v-menu>
  <UserSettingsDialog v-model="dialog" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserSettingsOneOfMultiple from './UserSettingsOneOfMultiple.vue'
import UserSettingsBoolean from './UserSettingsBoolean.vue'
import { UserSettingsItem, useUserSettingsStore } from '@/stores/userSettings'
import UserSettingsDialog from './UserSettingsDialog.vue'
import { useI18n } from 'vue-i18n'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'

const { t } = useI18n()
const { label } = useUserSettingTranslation()

const store = useUserSettingsStore()
const menu = ref(false)
const dialog = ref(false)

function updateModelValue(setting: UserSettingsItem) {
  store.add(setting)
}

function openAllSettings() {
  menu.value = false
  dialog.value = true
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}
</style>
