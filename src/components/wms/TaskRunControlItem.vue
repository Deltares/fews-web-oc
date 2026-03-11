<template>
  <v-list-item>
    <v-list-item-title> T0: {{ timeZeroString }} </v-list-item-title>
    <v-list-item-subtitle v-if="item?.isCurrent"> Current </v-list-item-subtitle>
    <template #append>
      <v-icon
        icon="mdi-circle"
        size="sm"
        :color="color"
        :disabled="item?.isCurrent"
      />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import type { TaskRun } from '@/lib/taskruns'
import { toHumanReadableDateTime } from '@/lib/date'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { computed } from 'vue'

interface Props {
  item: TaskRun | undefined
}
const { item } = defineProps<Props>()

const taskRunColorsStore = useTaskRunColorsStore()

const timeZeroString = computed(() => {
  if (!item) return ''
  return toHumanReadableDateTime(item.timeZeroTimestamp)
})

const color = computed(() => {
  if (!item) return
  return taskRunColorsStore.getColor(item.taskId)
})
</script>
