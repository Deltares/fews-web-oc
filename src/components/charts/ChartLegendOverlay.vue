<template>
  <div class="chart-controls-container">
    <v-sheet
      v-click-outside="onOutsideClick"
      class="chart-controls position-relative semi-transparent"
      :style="chartControlsStyle"
      border
    >
      <div
        ref="chartLegendContainer"
        :style="chartLegendContainerStyle"
        class="chart-legend-container w-100 overlay"
      >
        <v-chip-group
          ref="chartLegend"
          class="chart-legend overlay"
          :class="{ 'require-expand': requiresExpand }"
          multiple
          direction="vertical"
          :column="true"
          selected-class=""
        >
          <v-chip
            v-for="tag in tags"
            :key="tag.id"
            label
            :tile="true"
            size="small"
            role="button"
            density="default"
            class="ma-0"
            variant="text"
            @click="toggleLine(tag)"
            :disabled="!tag.interactive"
          >
            <div
              v-if="tag.legendSvg"
              class="legend-symbol me-2"
              :class="{ hidden: tag.disabled }"
              v-html="tag.legendSvg"
            />

            <span class="text-truncate">{{ tag.name }}</span>

            <v-tooltip
              v-if="tag.tooltip"
              activator="parent"
              location="top"
              :text="tag.tooltip"
            />
          </v-chip>
        </v-chip-group>
      </div>
      <v-btn
        v-show="requiresExpand"
        :icon="expandIcon"
        size="x-small"
        variant="plain"
        class="position-absolute"
        :style="expandButtonStyle"
        @click="onToggleExpand()"
      />
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import type { Margin } from '@deltares/fews-web-oc-charts'
import type { Tag } from '@/lib/charts/tags'
import { useElementSize, useToggle } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'
import type { ChartsSettings } from '@/lib/topology/componentSettings'

interface Props {
  tags: Tag[]
  margin: Margin
  settings:
    | ChartsSettings['timeSeriesChart']['legend']
    | ChartsSettings['verticalProfileChart']['legend']
}

const props = defineProps<Props>()

const emit = defineEmits(['toggleLine'])

const numberOfLines = computed(() => {
  const minLines =
    props.settings.minNumberOfLines === 'All'
      ? props.tags.length
      : Math.min(
          +props.settings.minNumberOfLines,
          Math.max(props.tags.length, +props.settings.minNumberOfLines),
        )
  const maxLines =
    props.settings.maxNumberOfLines === 'All'
      ? Math.max(props.tags.length, minLines)
      : Math.min(
          +props.settings.maxNumberOfLines,
          Math.max(props.tags.length, +props.settings.maxNumberOfLines),
        )
  return props.tags.length >= maxLines ? maxLines : minLines
})

const height = computed(() => {
  const chipHeight = 26
  return numberOfLines.value * chipHeight
})

const chartLegend = useTemplateRef('chartLegend')
const chartLegendContainer = useTemplateRef('chartLegendContainer')
const { height: legendHeight } = useElementSize(chartLegend)
const requiresExpand = computed(
  () => height.value && legendHeight.value > height.value,
)

watch(requiresExpand, () => {
  if (!requiresExpand.value) {
    toggleExpand(false)
  }
})

const [expanded, toggleExpand] = useToggle(false)

function toggleLine(tag: Tag) {
  tag.disabled = !tag.disabled
  emit('toggleLine', tag)
}

const chipMargin = 8
const chartControlsStyle = computed(() => {
  const { left = 0, right = 0, top = 0, bottom = 0 } = props.margin
  const offset = chipMargin

  const maxHeight =
    expanded.value || !requiresExpand.value
      ? `min(${legendHeight.value + 2}px, calc(100% - ${top + bottom}px))`
      : `${height.value + 2}px`

  const marginRight = right ? `${right + offset}px` : undefined
  const marginLeft = left ? `${left + offset}px` : undefined
  const marginTop = `${top + offset}px`
  const marginBottom = `${bottom + offset}px`

  const justifySelf = props.settings.placement.includes('right')
    ? 'flex-end'
    : 'flex-start'

  const alignSelf = props.settings.placement.includes('lower')
    ? 'flex-end'
    : 'flex-start'

  return {
    height: expanded.value ? maxHeight : undefined,
    marginRight,
    marginLeft,
    marginTop,
    marginBottom,
    width: 'min-content',
    alignSelf,
    justifySelf,
  }
})

const expandButtonStyle = computed(() => {
  return {
    bottom: '0px',
    right: '0px',
    height: '26px',
    width: '26px',
  }
})

const expandIcon = computed(() => {
  const isLower =
    props.settings.placement.includes('lower') ||
    props.settings.placement.includes('under')
  return isLower
    ? expanded.value
      ? 'mdi-chevron-down'
      : 'mdi-chevron-up'
    : expanded.value
      ? 'mdi-chevron-up'
      : 'mdi-chevron-down'
})

const chartLegendContainerStyle = computed(() => {
  return {
    height: expanded.value ? '100%' : `${height.value}px`,
    overflow: expanded.value ? 'auto' : 'hidden',
    marginBottom: props.settings.placement.includes('under')
      ? '2px'
      : undefined,
  }
})

function onOutsideClick() {
  if (expanded.value) {
    onToggleExpand()
  }
}

function onToggleExpand() {
  toggleExpand()
  if (chartLegendContainer.value) {
    chartLegendContainer.value.scrollTop = 0
  }
}
</script>

<style scoped>
.chart-controls-container {
  display: grid;
  position: absolute;
  flex: 0 0 auto;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.chart-controls {
  display: flex;
  pointer-events: auto;
  overflow: hidden;
  z-index: 10;
}

.chart-legend.overlay.require-expand {
  padding-right: 26px;
}

.semi-transparent {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.chart-legend-container.overlay {
  margin-left: 0;
}

.legend-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.v-chip--outlined) {
  opacity: 0.5;
}

:deep(.v-slide-group--vertical) {
  max-height: unset;
}

:deep(.v-chip__content) {
  overflow: hidden;
}

:deep(.v-chip-group) {
  padding: 0;
}

.overlay .hidden {
  opacity: 0;
}

:deep(.v-chip.v-chip--disabled) {
  opacity: 1 !important;
  pointer-events: none;
}
</style>
