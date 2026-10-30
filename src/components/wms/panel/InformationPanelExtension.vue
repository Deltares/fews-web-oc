<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-btn-toggle
        v-bind="props"
        v-model="selection"
        density="compact"
        variant="flat"
        mandatory
        class="overflow-visible"
      >
        <v-tooltip v-for="(item, index) in items" :key="index" location="top">
          <template #activator="{ props: tooltipProps }">
            <ExtensionButton
              v-if="item.isActive || isHovering"
              v-bind="tooltipProps"
              :isActive="item.isActive"
              :value="item[valueKey]"
              :text="getItemValue(item, textKey)"
              :icon="getItemValue(item, iconKey)"
              :activePrependIcon="activePrependIcon"
            />
          </template>
          <slot name="tooltip" :item="item"></slot>
        </v-tooltip>
      </v-btn-toggle>
    </template>
  </v-hover>
</template>

<script
  setup
  lang="ts"
  generic="
    U,
    T extends ExtensionItem &
      Record<ValueKey, U> &
      Partial<Record<TextKey, string>> &
      Partial<Record<IconKey, string>>,
    ValueKey extends keyof T,
    TextKey extends keyof T,
    IconKey extends keyof T
  "
>
import ExtensionButton from '@/components/wms/panel/ExtensionButton.vue'

export interface ExtensionItem {
  isActive: boolean
}

interface Props {
  items: T[]
  valueKey: ValueKey
  textKey?: TextKey
  iconKey?: IconKey
  activePrependIcon?: string
}
defineProps<Props>()

const selection = defineModel<U | null>({ required: true })

function getItemValue(item: T, key?: TextKey | IconKey): string | undefined {
  if (key === undefined) return undefined
  return item[key]
}
</script>
