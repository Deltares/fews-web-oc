<template>
  <v-hover v-model="isHovering">
    <template #default="{ props }">
      <v-btn-toggle
        ref="button-toggle"
        v-bind="props"
        v-model="selection"
        density="compact"
        variant="flat"
        mandatory
        class="overflow-x-auto button-container"
        @wheel="onWheel"
      >
        <v-tooltip v-for="(item, index) in items" :key="index" location="top">
          <template #activator="{ props: tooltipProps }">
            <ExtensionButton
              v-if="item.isActive || isExpanded"
              v-bind="tooltipProps"
              :isActive="item.isActive"
              :value="item[valueKey]"
              :text="getItemProperty(item, textKey)"
              :icon="getItemProperty(item, iconKey)"
              :activePrependIcon="activePrependIcon"
              :data-is-active="item.isActive"
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
import { useFocusWithin } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

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

const buttonToggle = useTemplateRef('button-toggle')
const buttonContainer = computed<HTMLDivElement | null>(() => {
  if (buttonToggle.value === null) return null
  return buttonToggle.value.$el as HTMLDivElement
})

const isHovering = ref<boolean>(false)
const { focused } = useFocusWithin(buttonToggle)
const isExpanded = computed<boolean>(() => isHovering.value || focused.value)

watch(isExpanded, async (newIsExpanded) => {
  if (!newIsExpanded) return
  // First, wait for the DOM to update.
  await nextTick()

  // Make sure we scroll the currently selected button into view upon expansion
  // of the toggle.
  const button = buttonContainer.value?.querySelector<HTMLButtonElement>(
    'button[data-is-active="true"]',
  )
  if (!button) return
  button.scrollIntoView({
    behavior: 'instant',
    inline: 'center',
  })
})

function getItemProperty(item: T, key?: TextKey | IconKey): string | undefined {
  if (key === undefined) return undefined
  return item[key]
}

function onWheel(event: WheelEvent): void {
  // Preserve horizontal scrolling behaviour where possible.
  if (event.deltaX !== 0) return
  if (buttonContainer.value === null) return
  buttonContainer.value.scrollLeft += event.deltaY
}
</script>

<style scoped>
.button-container {
  width: 400px;
}
</style>
