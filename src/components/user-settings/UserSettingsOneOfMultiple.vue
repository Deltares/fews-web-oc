<template>
  <v-list-item
    :disabled="setting.disabled"
    :subtitle="setting.label"
  >
    <v-list-item-action>
      <v-btn-toggle
        v-if="setting.items.length < 4"
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
          class="text-none"
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
        item-title="title"
        item-value="value"
        item-props
        flat
        hide-details
        :aria-label="`${setting.label}`"
        class="mt-2"
      >
        <template #selection="{ item }">
          <v-icon class="me-2" v-if="item.raw.icon">
            {{ item.raw.icon }}
          </v-icon>
          {{ item.raw.title }}
        </template>
        <template #item="{ item, props }">
          <v-list-item
            v-bind="props"
            :disabled="item.raw.disabled === true"
            :aria-label="`${setting.label} ${item.raw.title}`"
            :prepend-icon="item.raw.icon"
          />
        </template>
      </v-select>
    </v-list-item-action>
  </v-list-item>
</template>

<script setup lang="ts">
import { type UserSettingsItemOneOf } from '@/stores/userSettings'

interface Props {
  setting: UserSettingsItemOneOf
}
defineProps<Props>()

const modelValue = defineModel<string>({ required: true })
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
</style>
