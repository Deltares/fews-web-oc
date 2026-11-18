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
    <span v-if="readonly">{{ input.value }}</span>
    <TimeSeriesValueInput v-else :node="input" @change="onChange" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import TimeSeriesValueInput from './TimeSeriesValueInput.vue'
import type { DynamicReportEdit } from '@/lib/dynamic-report/nodes'
import { isReadonlyReportPosition } from './reportReadonly'

const props = defineProps(nodeViewProps)
const readonly = computed(() => {
  const pos = props.getPos()
  return (
    pos !== undefined && isReadonlyReportPosition(props.editor.state.doc, pos)
  )
})
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
