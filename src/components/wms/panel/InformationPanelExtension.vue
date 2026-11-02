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
        :class="{ 'button-container--grid': isGrid }"
        :style="gridStyle"
        @wheel="onWheel"
        @keydown="onKeydown"
      >
        <!-- In a grid, tooltips would cover neighbouring buttons -->
        <v-tooltip
          v-for="(item, index) in items"
          :key="index"
          location="top"
          :disabled="isGrid"
        >
          <template #activator="{ props: tooltipProps }">
            <ExtensionButton
              v-if="item.isActive || isExpanded"
              v-bind="tooltipProps"
              :isActive="item.isActive"
              :value="item[valueKey]"
              :text="getButtonText(item)"
              :icon="getItemProperty(item, iconKey)"
              :activePrependIcon="isGrid ? undefined : activePrependIcon"
              :compact="isGrid"
              :data-is-active="item.isActive"
            />
          </template>
          <slot name="tooltip" :item="item"></slot>
        </v-tooltip>
      </v-btn-toggle>
    </template>
  </v-hover>
  <!-- A single tooltip for the whole grid, shown while it is expanded -->
  <v-tooltip
    v-if="$slots.hint && buttonContainer"
    :activator="buttonContainer"
    :model-value="isGrid"
    :open-on-hover="false"
    :open-on-focus="false"
    :open-on-click="false"
    location="end"
  >
    <slot name="hint"></slot>
  </v-tooltip>
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
import {
  type ComponentPublicInstance,
  computed,
  nextTick,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

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
  // Text of the active button when collapsed, e.g. to give more context.
  collapsedText?: string
  // Show the expanded buttons in a grid with this number of columns instead of
  // a horizontally scrolling row.
  columns?: number
}
const props = defineProps<Props>()

const selection = defineModel<U | null>({ required: true })

const buttonToggle = useTemplateRef<ComponentPublicInstance>('button-toggle')
const buttonContainer = computed<HTMLDivElement | null>(() => {
  if (buttonToggle.value === null) return null
  return buttonToggle.value.$el as HTMLDivElement
})

const isHovering = ref<boolean>(false)
const { focused } = useFocusWithin(buttonToggle)
const isExpanded = computed<boolean>(() => isHovering.value || focused.value)

const isGrid = computed<boolean>(
  () => props.columns !== undefined && isExpanded.value,
)
const gridStyle = computed(() =>
  isGrid.value
    ? { gridTemplateColumns: `repeat(${props.columns}, 1fr)` }
    : undefined,
)

watch(isExpanded, async (newIsExpanded) => {
  // All buttons of a grid are visible, so there is no need to scroll.
  if (!newIsExpanded || isGrid.value) return
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

function getButtonText(item: T): string | undefined {
  if (item.isActive && !isExpanded.value && props.collapsedText) {
    return props.collapsedText
  }
  return getItemProperty(item, props.textKey)
}

function getItemProperty(item: T, key?: TextKey | IconKey): string | undefined {
  if (key === undefined) return undefined
  return item[key]
}

// Arrow keys select the previous or next item, and in a grid also the item in
// the row above or below. Focus moves along so the selection stays visible.
async function onKeydown(event: KeyboardEvent): Promise<void> {
  const rowStep = isGrid.value ? props.columns : undefined
  const steps: Record<string, number | undefined> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: rowStep === undefined ? undefined : -rowStep,
    ArrowDown: rowStep,
  }
  const step = steps[event.key]
  if (step === undefined) return

  const activeIndex = props.items.findIndex((item) => item.isActive)
  const nextItem = props.items[activeIndex + step]
  // Also prevent scrolling the page when there is no item in this direction.
  event.preventDefault()
  if (activeIndex === -1 || nextItem === undefined) return

  selection.value = nextItem[props.valueKey]
  await nextTick()
  buttonContainer.value
    ?.querySelector<HTMLButtonElement>('button[data-is-active="true"]')
    ?.focus()
}

function onWheel(event: WheelEvent): void {
  // Preserve horizontal scrolling behaviour where possible.
  if (event.deltaX !== 0 || isGrid.value) return
  if (buttonContainer.value === null) return
  buttonContainer.value.scrollLeft += event.deltaY
}
</script>

<style scoped>
.button-container {
  max-width: 400px;
}

.button-container.button-container--grid {
  display: grid;
  /* Same row height as the collapsed button group */
  grid-auto-rows: 36px;
  width: max-content;
  max-width: none;
  height: auto;
}
</style>
