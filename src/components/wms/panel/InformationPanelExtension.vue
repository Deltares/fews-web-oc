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
              v-if="isActive(item) || isExpanded"
              v-bind="tooltipProps"
              :isActive="isActive(item)"
              :value="item[valueKey]"
              :text="getButtonText(item)"
              :icon="getItemProperty(item, iconKey)"
              :activePrependIcon="isGrid ? undefined : activePrependIcon"
              :compact="isGrid"
              :class="getCornerClasses(index)"
              :data-is-active="isActive(item)"
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
    T extends Record<ValueKey, U> &
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

function isActive(item: T): boolean {
  return item[props.valueKey] === selection.value
}

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

const allCorners = [
  'corner--top-start',
  'corner--top-end',
  'corner--bottom-start',
  'corner--bottom-end',
]

// Only the outer corners of the buttons are rounded, also for the active
// button. When collapsed only the active button is shown, so it has all
// corners rounded. When expanded the buttons form a single row or a grid; with
// an incomplete last row, the last button of the row above also forms an outer
// corner.
function getCornerClasses(index: number): string[] {
  if (!isExpanded.value) return allCorners

  const numItems = props.items.length
  const columns = isGrid.value ? (props.columns ?? numItems) : numItems
  const lastIndex = numItems - 1
  const lastRow = Math.floor(lastIndex / columns)
  const row = Math.floor(index / columns)
  const isRowEnd = index % columns === columns - 1 || index === lastIndex
  const isAboveIncompleteLastRow =
    row === lastRow - 1 && index + columns > lastIndex

  const classes: string[] = []
  if (index === 0) classes.push('corner--top-start')
  if (row === 0 && isRowEnd) classes.push('corner--top-end')
  if (row === lastRow && index % columns === 0) {
    classes.push('corner--bottom-start')
  }
  if (index === lastIndex || (isRowEnd && isAboveIncompleteLastRow)) {
    classes.push('corner--bottom-end')
  }
  return classes
}

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
  if (isActive(item) && !isExpanded.value && props.collapsedText) {
    return props.collapsedText
  }
  return getItemProperty(item, props.textKey)
}

function getItemProperty(item: T, key?: TextKey | IconKey): string | undefined {
  if (key === undefined) return undefined
  return item[key]
}

// Select the item at the given offset from the active item, e.g. -1 for the
// previous item. Returns false if there is no item at that offset.
async function selectRelative(
  step: number,
  { focus }: { focus: boolean },
): Promise<boolean> {
  const activeIndex = props.items.findIndex(isActive)
  const nextItem = props.items[activeIndex + step]
  if (activeIndex === -1 || nextItem === undefined) return false

  selection.value = nextItem[props.valueKey]
  if (focus) {
    await nextTick()
    buttonContainer.value
      ?.querySelector<HTMLButtonElement>('button[data-is-active="true"]')
      ?.focus()
  }
  return true
}

// Arrow keys select the previous or next item, and in a grid also the item in
// the row above or below. Focus moves along so the selection stays visible.
function onKeydown(event: KeyboardEvent): void {
  const rowStep = isGrid.value ? props.columns : undefined
  const steps: Record<string, number | undefined> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: rowStep === undefined ? undefined : -rowStep,
    ArrowDown: rowStep,
  }
  const step = steps[event.key]
  if (step === undefined) return

  // Also prevent scrolling the page when there is no item in this direction.
  event.preventDefault()
  selectRelative(step, { focus: true })
}

// Scroll distance in pixels for a single step through the grid. A mouse wheel
// notch is at least this distance and steps once, the small amounts of a
// trackpad are accumulated.
const WHEEL_STEP_DISTANCE = 40
let wheelDistance = 0

// Wheel deltas can be in pixels, lines or pages, depending on the browser and
// device.
function getWheelDelta(event: WheelEvent, pageSize: number): number {
  // Use the dominant direction, e.g. for horizontal scrolling on a trackpad.
  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * 16
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * pageSize
  return delta
}

// In a grid, the wheel walks through the items in order. In a row, the wheel
// scrolls the row horizontally. In both cases the wheel event does not reach
// the map below.
function onWheel(event: WheelEvent): void {
  const container = buttonContainer.value
  if (container === null) return
  event.preventDefault()

  const delta = getWheelDelta(event, container.clientWidth)
  if (!isGrid.value) {
    container.scrollLeft += delta
    return
  }

  // Reset when changing direction, so the selection responds immediately.
  if (Math.sign(delta) !== Math.sign(wheelDistance)) wheelDistance = 0
  wheelDistance += delta
  if (Math.abs(wheelDistance) < WHEEL_STEP_DISTANCE) return
  wheelDistance = 0
  selectRelative(Math.sign(delta), { focus: focused.value })
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

/* Square buttons, also when active, except at the outer corners */
.button-container.v-btn-group .v-btn {
  border-radius: 0;
}

.button-container.v-btn-group .corner--top-start {
  border-start-start-radius: 4px;
}

.button-container.v-btn-group .corner--top-end {
  border-start-end-radius: 4px;
}

.button-container.v-btn-group .corner--bottom-start {
  border-end-start-radius: 4px;
}

.button-container.v-btn-group .corner--bottom-end {
  border-end-end-radius: 4px;
}
</style>
