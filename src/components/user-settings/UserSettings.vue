<template>
  <v-list
    v-for="group in visibleGroups"
    :key="group.id"
    class="py-1"
    density="compact"
  >
    <v-list-subheader>{{ groupTitle(group) }}</v-list-subheader>

    <template v-for="setting in store.listByGroup(group.id)" :key="setting.id">
      <UserSettingsOneOfMultiple
        v-if="setting.type === 'oneOfMultiple'"
        :setting="setting"
        :model-value="setting.value"
        @update:modelValue="onValueChange({ ...setting, value: $event })"
        :aria-label="`${groupTitle(group)} ${label(setting)}`"
        inline
      >
        <template #append>
          <UserSettingsFavorite
            :model-value="setting.favorite"
            @update:modelValue="onValueChange({ ...setting, favorite: $event })"
          />
        </template>
      </UserSettingsOneOfMultiple>

      <UserSettingsBoolean
        v-else-if="setting.type === 'boolean'"
        :setting="setting"
        :model-value="setting.value"
        @update:modelValue="onValueChange({ ...setting, value: $event })"
        :aria-label="`${groupTitle(group)} ${label(setting)}`"
        inline
      >
        <template #append>
          <UserSettingsFavorite
            :model-value="setting.favorite"
            @update:modelValue="onValueChange({ ...setting, favorite: $event })"
          />
        </template>
      </UserSettingsBoolean>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import UserSettingsBoolean from './UserSettingsBoolean.vue'
import UserSettingsOneOfMultiple from './UserSettingsOneOfMultiple.vue'
import UserSettingsFavorite from './UserSettingsFavorite.vue'
import { UserSettingsItem, useUserSettingsStore } from '@/stores/userSettings'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'
import { computed } from 'vue'

const store = useUserSettingsStore()
const { label, groupTitle } = useUserSettingTranslation()

const visibleGroups = computed(() =>
  store.groups.filter((group) => store.listByGroup(group.id).length > 0),
)

const onValueChange = (item: UserSettingsItem) => {
  store.add(item)
}
</script>
