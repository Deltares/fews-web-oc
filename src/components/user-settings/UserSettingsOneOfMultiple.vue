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
        :aria-label="setting.label"
      >
        <v-btn
          v-for="item of setting.items"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          :aria-label="`${setting.label} ${item.title}`"
          v-tooltip:top="item.title"
        >
          <v-icon v-if="item.icon">{{ item.icon }}</v-icon>
          <span v-else>{{ item.title }}</span>
        </v-btn>
      </v-btn-toggle>

      <v-select
        v-else
        v-model="modelValue"
        :items="setting.items"
        variant="solo-filled"
        density="compact"
        :label="inline ? setting.label : undefined"
        item-title="title"
        item-value="value"
        item-props
        flat
        hide-details
        :aria-label="setting.label"
        :class="{ 'mt-2': !inline, inline }"
      >
        <template #selection="{ item }">
          <v-icon class="me-2" size="small" v-if="item.icon">
            {{ item.icon }}
          </v-icon>
          {{ item.title }}
        </template>
        <template #item="{ item, props }">
          <v-list-item
            v-bind="props"
            :disabled="item.disabled === true"
            :aria-label="`${setting.label} ${item.title}`"
            :prepend-icon="item.icon"
          />
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
import { computed } from 'vue'

interface Props {
  setting: UserSettingsItemOneOf
  inline?: boolean
}
const props = defineProps<Props>()

const modelValue = defineModel<string>({ required: true })

const subtitle = computed(() => {
  if (props.inline) return
  return props.setting.label
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

:deep(.inline.v-select .v-field__input) {
  --v-input-control-height: 45px;
}
</style>
