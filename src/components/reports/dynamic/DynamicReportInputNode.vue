<template>
  <NodeViewWrapper
    as="span"
    class="dynamic-report-input-node"
    :class="node.attrs.class"
    :style="node.attrs.style"
    :id="node.attrs.id"
    :data-input-type="input.inputType"
    :data-time-series-index="input.timeSeriesIndex"
    :data-time="input.time"
  >
    <TimeSeriesValueInput :node="input" @change="onChange" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import TimeSeriesValueInput from './TimeSeriesValueInput.vue'
import type { DynamicReportEdit } from '@/lib/dynamic-report/nodes'

const props = defineProps(nodeViewProps)
const input = computed(() => ({
  inputType: String(props.node.attrs.inputType),
  timeSeriesIndex: String(props.node.attrs.timeSeriesIndex),
  time: String(props.node.attrs.time),
  value: String(props.node.attrs.value),
}))

function onChange(edit: DynamicReportEdit) {
  props.updateAttributes({ value: edit.value })
}
</script>
