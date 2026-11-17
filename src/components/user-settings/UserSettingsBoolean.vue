<template>
  <v-list-item :disabled="setting.disabled" density="compact">
    <v-switch
      v-if="setting.type === 'boolean'"
      v-model="modelValue"
      :label="settingLabel"
      :disabled="setting.disabled"
      density="compact"
      color="primary"
      class="ml-3"
      hide-details
      :aria-label="settingLabel"
    >
      <template #label>
        <v-label
          :class="{
            'text-subtitle-2': !inline,
            'text-medium-emphasis': !inline,
          }"
        >
          {{ settingLabel }}
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
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'
import { computed } from 'vue'

interface Props {
  setting: UserSettingsItemBoolean
  inline?: boolean
}
const props = defineProps<Props>()

const modelValue = defineModel<boolean>({ required: true })

const { label } = useUserSettingTranslation()
const settingLabel = computed(() => label(props.setting))
</script>
