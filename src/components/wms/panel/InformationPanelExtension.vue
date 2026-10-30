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
              :text="getItemProperty(item, textKey)"
              :icon="getItemProperty(item, iconKey)"
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
      Partial<Record<Exclude<TextKey, undefined>, string>> &
      Partial<Record<Exclude<IconKey, undefined>, string>>,
    ValueKey extends keyof T,
    TextKey extends keyof T | undefined = undefined,
    IconKey extends keyof T | undefined = undefined
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

function getItemProperty(item: T, key?: TextKey | IconKey): string | undefined {
  if (key === undefined) return undefined
  return item[key]
}
</script>
