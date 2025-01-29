<template>
  <!-- Fills up space as v-sheet is absolutely positioned -->
  <div v-if="!overlay" :style="{ height: `${legendContainerHeight}px` }" />
  <div class="chart-controls-container">
    <v-sheet
      v-click-outside="onOutsideClick"
      class="chart-controls"
      :style="chartControlsStyle"
      :elevation="expanded ? 5 : 0"
    >
      <div
        ref="chartLegendContainer"
        :style="chartLegendContainerStyle"
        class="chart-legend-container w-100"
      >
        <v-chip-group ref="chartLegend" column multiple>
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
              v-html="tag.legendSvg"
            />

            <span class="text-truncate">{{ tag.name }}</span>
          </v-chip>
        </v-chip-group>
      </div>
      <v-btn
        v-show="requiresExpand"
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="plain"
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
import { ChartSettings } from '@/lib/topology/componentSettings'

interface Props {
  tags: Tag[]
  margin: Margin
  settings:
    | ChartSettings['timeseriesChart']['legend']
    | ChartSettings['verticalProfileChart']['legend']
}

const props = defineProps<Props>()

const emit = defineEmits(['toggleLine'])

const overlay = computed(() => props.settings.placement.includes('inside'))

const height = computed(() => {
  const numOfLines = props.settings.numberOfLines
  if (numOfLines === 'all') {
    return 100 * 40
  }
  return numOfLines * 40
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

const legendContainerHeight = computed(() => {
  return Math.min(height.value, legendHeight.value)
})
const chipMargin = 8
const chartControlsStyle = computed(() => {
  const { left = 0, right = 0, top = 0, bottom = 0 } = props.margin
  const offset = overlay.value ? -chipMargin : chipMargin

  const maxHeight =
    expanded.value || !requiresExpand.value
      ? '95%'
      : `${legendContainerHeight.value}px`
  const minHeight = `${legendContainerHeight.value}px`
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
  overflow: hidden;
  z-index: 10;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.chart-controls {
  pointer-events: auto;
  background-color: rgba(var(--v-theme-surface), 0.9);
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
</style>
