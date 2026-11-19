<template>
  <v-list-item :disabled="isDisabled" density="compact">
    <v-switch
      v-if="setting.type === 'boolean'"
      v-model="modelValue"
      :label="settingLabel"
      :disabled="isDisabled"
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
      <v-icon
        v-if="isConfiguratorOnly"
        v-tooltip:top="disabledForNormalUsersLabel"
        :aria-label="disabledForNormalUsersLabel"
        color="warning"
        data-test-id="disabled-user-setting-indicator"
      >
        mdi-eye-off-outline
      </v-icon>
      <slot name="append" />
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
import { type UserSettingsItemBoolean } from '@/stores/userSettings'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'
import { computed } from 'vue'
import { useConfiguratorModeStore } from '@/stores/configuratorMode'
import { useI18n } from 'vue-i18n'

interface Props {
  setting: UserSettingsItemBoolean
  inline?: boolean
}
const props = defineProps<Props>()

const modelValue = defineModel<boolean>({ required: true })

const { label } = useUserSettingTranslation()
const { t } = useI18n()
const configuratorMode = useConfiguratorModeStore()
const settingLabel = computed(() => label(props.setting))
const isDisabled = computed(
  () => props.setting.disabled && !configuratorMode.isEnabled,
)
const isConfiguratorOnly = computed(
  () => props.setting.disabled && configuratorMode.isEnabled,
)
const disabledForNormalUsersLabel = computed(() =>
  t('configurator.disabledSetting'),
)
</script>
