<template>
  <v-list-item :disabled="setting.disabled">
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
        <v-label class="text-subtitle-2 text-medium-emphasis">
          {{ setting.label }}
        </v-label>
      </template>
    </v-switch>
  </v-list-item>
</template>

<script lang="ts" setup>
import { type UserSettingsItemBoolean } from '@/stores/userSettings'

interface Props {
  setting: UserSettingsItemBoolean
}
defineProps<Props>()

const modelValue = defineModel<boolean>({ required: true })
</script>
