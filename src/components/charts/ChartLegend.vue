<template>
  <!-- Fills up space as v-sheet is absolutely positioned -->
  <div class="mt-1" :style="{ height: `${legendContainerHeight}px` }" />
  <v-sheet
    v-click-outside="onOutsideClick"
    class="mt-1 chart-controls"
    :style="chartControlsStyle"
    :elevation="expanded ? 5 : 0"
    rounded
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
          :variant="tag.disabled ? 'text' : 'tonal'"
          @click="toggleLine(tag)"
        >
          <div
            v-if="tag.legendSvg"
            class="legend-symbol me-2"
            v-html="tag.legendSvg"
          />

          <span>{{ tag.name }}</span>
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
</template>

<script setup lang="ts">
import type { Margin } from '@deltares/fews-web-oc-charts'
import type { Tag } from '@/lib/charts/tags'
import { useElementSize, useToggle } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'

interface Props {
  tags: Tag[]
  lines: number
  margin: Margin
}

const props = defineProps<Props>()

const emit = defineEmits(['toggleLine'])

const height = computed(() => props.lines * 40)

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
const chipMargin = 5
const chartControlsStyle = computed(() => ({
  maxHeight: expanded.value ? '95%' : `${legendContainerHeight.value}px`,
  minHeight: `${legendContainerHeight.value}px`,
  marginRight: props.margin.right
    ? `${props.margin.right - chipMargin}px`
    : undefined,
  marginLeft: props.margin.left
    ? `${props.margin.left - chipMargin}px`
    : undefined,
  width: `calc(100% - ${(props.margin.left ?? 0) + (props.margin.right ?? 0) - 2 * chipMargin}px)`,
}))

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
.chart-controls {
  display: flex;
  position: absolute;
  flex: 0 0 auto;
  overflow: hidden;
  z-index: 10;
}

.chart-legend-container {
  max-height: 100%;
  margin-left: v-bind(chipMargin + 'px');
  margin-right: v-bind(chipMargin + 'px');
}

.legend-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.v-chip--outlined) {
  opacity: 0.5;
}
</style>
