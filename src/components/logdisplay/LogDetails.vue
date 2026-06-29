<template>
  <div ref="logDetailsContainer">
    <LogTable
      v-if="resolvedMode === 'table'"
      :logs="logs"
      :taskRun="taskRun"
      :disseminations="disseminations"
      :disseminationStatus="disseminationStatus"
      @disseminate-log="(log, dis) => emit('disseminateLog', log, dis)"
      @edit-log="emit('editLog', $event)"
      @delete-log="emit('deleteLog', $event)"
      v-bind="$attrs"
    />
    <LogTimeLine
      v-else
      :logs="logs"
      :taskRuns="taskRunsForTimeline"
      :disseminations="disseminations"
      :disseminationStatus="disseminationStatus"
      :userName="userName"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import type { LogDisplayDisseminationAction } from '@deltares/fews-pi-requests'
import type { TaskRun } from '@/lib/taskruns'
import {
  type LogActionEmit,
  type LogDisseminationStatus,
  type LogMessage,
} from '@/lib/log'
import { computed, ref } from 'vue'
import LogTable from './LogTable.vue'
import LogTimeLine from './LogTimeLine.vue'

export type LogDetailsMode = 'auto' | 'table' | 'timeline'

interface Props {
  logs: LogMessage[]
  taskRun?: TaskRun
  taskRuns?: TaskRun[]
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
  userName?: string
  mode?: LogDetailsMode
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'auto',
  userName: '',
})

const emit = defineEmits<LogActionEmit>()

const logDetailsContainer = ref<HTMLElement>()
const { width: containerWidth } = useElementSize(logDetailsContainer)

const taskRunsForTimeline = computed(() =>
  props.taskRuns ?? (props.taskRun ? [props.taskRun] : []),
)

const resolvedMode = computed<Exclude<LogDetailsMode, 'auto'>>(() => {
  if (props.mode === 'table' || props.mode === 'timeline') {
    return props.mode
  }

  return containerWidth.value > 0 && containerWidth.value <= 600
    ? 'timeline'
    : 'table'
})
</script>
