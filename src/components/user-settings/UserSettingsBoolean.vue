<template>
  <v-list-item :disabled="setting.disabled" density="compact">
    <v-switch
      v-if="setting.type === 'boolean'"
      v-model="modelValue"
      :label="setting.label"
      :disabled="setting.disabled"
      density="compact"
      color="primary"
      class="ml-3"
      hide-details
      :aria-label="setting.label"
    >
      <template #label>
        <v-label
          :class="{
            'text-subtitle-2': !inline,
            'text-medium-emphasis': !inline,
          }"
        >
          {{ setting.label }}
        </v-label>
      </template>
    </v-switch>
    <template #append>
      <slot name="append" />
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
import { type UserSettingsItemBoolean } from '@/stores/userSettings'

interface Props {
  setting: UserSettingsItemBoolean
  inline?: boolean
}
defineProps<Props>()

const modelValue = defineModel<boolean>({ required: true })
</script>
