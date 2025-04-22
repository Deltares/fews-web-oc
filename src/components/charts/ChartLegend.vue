<template>
  <!-- Fills up space as v-sheet is absolutely positioned -->
  <div v-if="!overlay" class="flex-0-0" :style="{ height: `${height}px` }" />
  <div class="chart-controls-container">
    <v-sheet
      v-click-outside="onOutsideClick"
      class="chart-controls"
      :class="{ 'semi-transparent': overlay }"
      :style="chartControlsStyle"
      :elevation="expanded && !overlay ? 5 : 0"
      :border="overlay"
    >
      <div
        ref="chartLegendContainer"
        :style="chartLegendContainerStyle"
        class="chart-legend-container w-100"
        :class="{ 'align-self-end': !overlay }"
      >
        <v-chip-group
          ref="chartLegend"
          class="chart-legend"
          :class="{ overlay }"
          multiple
          :column="!overlay"
          selected-class=""
        >
          <v-chip
            v-for="tag in tags"
            :key="tag.id"
            label
            size="small"
            role="button"
            :density="overlay ? 'compact' : 'default'"
            :variant="tag.disabled || overlay ? 'text' : 'tonal'"
            @click="toggleLine(tag)"
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
        :size="overlay ? 'x-small' : 'small'"
        variant="plain"
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

const overlay = computed(() => props.settings.placement.includes('inside'))

const height = computed(() => {
  const numOfLines =
    props.settings.numberOfLines === 'all'
      ? 99999
      : +props.settings.numberOfLines

  if (overlay.value) {
    const chipHeight = 26
    return numOfLines * chipHeight + 4
  } else {
    const chipHeight = 34
    return numOfLines * chipHeight + 4
  }
})

const chartLegend = useTemplateRef('chartLegend')
const chartLegendContainer = useTemplateRef('chartLegendContainer')
const { height: legendHeight } = useElementSize(chartLegend)
const requiresExpand = computed(() => legendHeight.value > height.value)
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
  const offset = overlay.value ? -chipMargin : chipMargin

  const maxHeight =
    expanded.value || !requiresExpand.value ? '95%' : `${height.value}px`
  const minHeight = overlay.value ? undefined : `${height.value}px`
  const marginRight = right ? `${right - offset}px` : undefined
  const marginLeft = left ? `${left - offset}px` : undefined
  const marginTop = overlay.value ? `${top - offset}px` : undefined
  const marginBottom = overlay.value ? `${bottom - offset}px` : undefined
  const width = overlay.value
    ? 'min-content'
    : `calc(100% - ${marginRight ?? 0} - ${marginLeft ?? 0})`

  const alignSelf = props.settings.placement.includes('lower')
    ? 'flex-end'
    : 'flex-start'
  const justifySelf = props.settings.placement.includes('right')
    ? 'flex-end'
    : 'flex-start'

  return {
    maxHeight,
    minHeight,
    marginRight,
    marginLeft,
    marginTop,
    marginBottom,
    width,
    alignSelf,
    justifySelf,
  }
})

const expandButtonStyle = computed(() => {
  const alignSelf = props.settings.placement.includes('lower')
    ? 'flex-start'
    : 'flex-end'
  const height = overlay.value ? '28px' : undefined
  const width = overlay.value ? '28px' : undefined
  return {
    alignSelf,
    height,
    width,
  }
})

const expandIcon = computed(() => {
  const isLower = props.settings.placement.includes('lower')
  if (isLower) {
    return expanded.value ? 'mdi-chevron-down' : 'mdi-chevron-up'
  } else {
    return expanded.value ? 'mdi-chevron-up' : 'mdi-chevron-down'
  }
})

const chartLegendContainerStyle = computed(() => ({
  overflow: expanded.value ? 'auto' : 'hidden',
}))

function onOutsideClick() {
  if (expanded.value) {
    onToggleExpand()
  }
}

function onToggleExpand() {
  toggleExpand()
  if (chartLegendContainer.value) {
    // Scroll to top when closing expand
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

.semi-transparent {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.chart-legend {
  margin-top: 2px;
  margin-bottom: 2px;
}

.overlay :deep(.v-slide-group__content) {
  flex-direction: column;
}

.chart-legend-container {
  max-height: 100%;
  margin-left: v-bind(chipMargin + 'px');
}

.legend-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.v-chip--outlined) {
  opacity: 0.5;
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

.pre-line {
  white-space: pre-line;
}
</style>
