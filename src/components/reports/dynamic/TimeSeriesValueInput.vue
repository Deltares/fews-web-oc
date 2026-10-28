<template>
  <!-- Use a text input because Edge ignores the English locale and may use a comma as the decimal separator. -->
  <input
    :aria-label="t('dynamicReport.valueInputLabel', { time: node.time })"
    v-model="value"
    class="time-series-value-input"
    type="text"
    :inputmode="node.inputType === 'number' ? 'decimal' : 'text'"
    :placeholder="t('dynamicReport.valueInputPlaceholder')"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  DynamicReportEdit,
  DynamicReportNode,
} from '@/lib/dynamic-report/nodes'

interface Props {
  node: DynamicReportNode
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
  change: [edit: DynamicReportEdit]
}>()

const value = ref(props.node.value)

function onInput() {
  emit('change', {
    timeSeriesIndex: props.node.timeSeriesIndex,
    time: props.node.time,
    value: value.value,
  })
}
</script>
