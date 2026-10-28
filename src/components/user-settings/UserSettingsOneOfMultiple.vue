<template>
  <v-list-item
    :disabled="setting.disabled"
    :subtitle="subtitle"
    density="compact"
  >
    <v-list-item-action>
      <v-btn-toggle
        v-if="setting.items.length < 4 && !inline"
        density="compact"
        class="my-2 multi-line-toggle"
        v-model="modelValue"
        mandatory
        :aria-label="settingLabel"
      >
        <v-btn
          v-for="item of options"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          :aria-label="`${settingLabel} ${item.title}`"
          v-tooltip:top="item.title"
        >
          <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
          <span v-else>{{ item.abbreviation ?? item.title }}</span>
        </v-btn>
      </v-btn-toggle>

      <v-select
        v-else
        v-model="modelValue"
        :items="options"
        variant="solo-filled"
        density="compact"
        :label="inline ? settingLabel : undefined"
        item-title="title"
        item-value="value"
        item-props
        flat
        hide-details
        :aria-label="settingLabel"
        :class="{ 'mt-2': !inline, inline }"
      >
        <template #selection="{ item }">
          <v-icon class="me-2" size="small" v-if="item.icon">
            {{ item.icon }}
          </v-icon>
          <span v-else-if="item.abbreviation" class="abbreviation me-2">
            {{ item.abbreviation }}
          </span>
          {{ item.title }}
        </template>
        <template #item="{ item, props }">
          <v-list-item
            v-bind="props"
            :disabled="item.disabled === true"
            :aria-label="`${settingLabel} ${item.title}`"
            :prepend-icon="item.icon"
          >
            <template v-if="!item.icon && item.abbreviation" #prepend>
              <span class="abbreviation list-abbreviation">
                {{ item.abbreviation }}
              </span>
            </template>
          </v-list-item>
        </template>
      </v-select>
    </v-list-item-action>

    <template #append>
      <slot name="append" />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { type UserSettingsItemOneOf } from '@/stores/userSettings'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'
import { computed } from 'vue'

interface Props {
  setting: UserSettingsItemOneOf
  inline?: boolean
}
const props = defineProps<Props>()

const modelValue = defineModel<string>({ required: true })

const { label, optionTitle } = useUserSettingTranslation()

const settingLabel = computed(() => label(props.setting))

const options = computed(() =>
  props.setting.items.map((item) => ({
    ...item,
    title: optionTitle(props.setting, item),
  })),
)

const subtitle = computed(() => {
  if (props.inline) return
  return settingLabel.value
})
</script>

<style scoped>
.multi-line-toggle {
  width: 200px;
  flex-wrap: wrap;
}

.multi-line-toggle .v-btn {
  height: 36px !important;
}

:deep(.v-btn-group--density-compact.v-btn-group) {
  height: unset;
}

/* Takes the place and size of an icon. */
.abbreviation {
  display: inline-block;
  min-width: 24px;
  text-align: center;
  font-weight: 500;
}

/* Matches the gap Vuetify adds after a prepended icon. */
.list-abbreviation {
  margin-inline-end: 32px;
}

:deep(.inline.v-select .v-field__input) {
  --v-input-control-height: 45px;
}
</style>
