<template>
  <v-list
    v-for="group in store.groups"
    :key="group.id"
    class="py-1"
    density="compact"
  >
    <v-list-subheader>{{ group.title }}</v-list-subheader>

    <template v-for="setting in store.listByGroup(group.id)" :key="setting.id">
      <UserSettingsOneOfMultiple
        v-if="setting.type === 'oneOfMultiple'"
        :setting="setting"
        :model-value="setting.value"
        @update:modelValue="onValueChange({ ...setting, value: $event })"
        :aria-label="`${group} ${setting.label}`"
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
        :aria-label="`${group} ${setting.label}`"
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

const store = useUserSettingsStore()

const onValueChange = (item: UserSettingsItem) => {
  store.add(item)
}
</script>
