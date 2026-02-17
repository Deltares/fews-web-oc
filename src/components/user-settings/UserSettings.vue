<template>
  <div v-for="group in groups" :key="group" class="mb-2">
    <v-list-subheader>{{ group }}</v-list-subheader>
    <v-list-item
      v-for="(setting, index) in store.listByGroup(group)"
      :key="index"
      :disabled="setting?.disabled"
    >
      <v-select
        v-if="setting.type === 'oneOfMultiple'"
        :label="setting.label"
        v-model="setting.value"
        :items="setting.items"
        :disabled="setting.disabled"
        variant="solo-filled"
        density="compact"
        item-title="title"
        item-value="value"
        :item-props="true"
        flat
        hide-details
        :aria-label="`${group} ${setting.label}`"
        @click.preventDefault
        @update:modelValue="onValueChange(setting)"
      >
        <template #item="{ props }">
          <v-list-item
            v-bind="props"
            :aria-label="`${group} ${setting.label} ${props.title}`"
          >
            <template #prepend>
              <v-icon>
                {{ props.icon }}
              </v-icon>
            </template>
          </v-list-item>
        </template>
      </v-select>
      <template #prepend>
        <v-switch
          v-if="setting.type === 'boolean'"
          v-model="setting.value"
          color="primary"
          :label="setting.label"
          :disabled="setting.disabled"
          hide-details
          @update:modelValue="onValueChange(setting)"
          :aria-label="`${group} ${setting.label}`"
        >
        </v-switch>
      </template>
      <template v-slot:append>
        <v-btn
          color="grey-lighten-1"
          icon="mdi-information"
          variant="text"
          class="flex-0-0 align-self-center"
          @click="onFavoriteChange(setting)"
          :aria-label="`favorite ${group} ${setting.label}`"
        >
          <v-icon>{{
            setting.favorite ? 'mdi-star' : 'mdi-star-outline'
          }}</v-icon>
          <v-tooltip activator="parent" location="top"> Favorite </v-tooltip>
        </v-btn>
      </template>
    </v-list-item>
  </div>
</template>

<script setup lang="ts">
import { UserSettingsItem, useUserSettingsStore } from '@/stores/userSettings'
import { computed } from 'vue'

const store = useUserSettingsStore()
const groups = computed(() => store.listGroups)

const onValueChange = (item: UserSettingsItem) => {
  store.add(item)
}

const onFavoriteChange = (item: UserSettingsItem) => {
  item.favorite = !item.favorite
  onValueChange(item)
}
</script>
