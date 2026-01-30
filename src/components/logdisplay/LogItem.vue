<template>
  <template v-if="log.type === 'system'">
    <TaskRunItem
      :title="getTitleForLog(log, userName)"
      :entryTime="log.entryTime"
      :taskRun="taskRun"
      :logs="logs"
      :expanded="expanded"
      class="mt-2"
      :ripple="false"
      @click="onExpansionPanelToggle"
    />
    <LogTable
      v-if="expanded"
      :logs="logs"
      :taskRun="taskRun"
      :disseminations="disseminations"
      :disseminationStatus="disseminationStatus"
      @disseminate-log="(log, dis) => emit('disseminateLog', log, dis)"
      @edit-log="emit('editLog', $event)"
      @delete-log="emit('deleteLog', $event)"
      v-bind="$attrs"
    />
  </template>
  <LogMessageItem
    v-if="log.type === 'manual' && noteGroup"
    class="mt-2"
    :noteGroup="noteGroup"
    :log="log"
    :userName="userName"
    :disseminations="disseminations"
    :disseminationStatus="disseminationStatus"
    @disseminate-log="(log, dis) => emit('disseminateLog', log, dis)"
    @edit-log="emit('editLog', $event)"
    @delete-log="emit('deleteLog', $event)"
    @acknowledge-log="emit('acknowledgeLog', $event)"
    @unacknowledge-log="emit('unacknowledgeLog', $event)"
  />
</template>

<script setup lang="ts">
import LogMessageItem from '@/components/logdisplay/LogMessageItem.vue'
import TaskRunItem from './TaskRunItem.vue'
import LogTable from './LogTable.vue'
import type {
  ForecasterNoteGroup,
  LogDisplayDisseminationAction,
} from '@deltares/fews-pi-requests'
import {
  type LogActionEmit,
  type LogDisseminationStatus,
  type LogMessage,
  logToUser,
} from '@/lib/log'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed, ref } from 'vue'
import type { TaskRun } from '@/lib/taskruns'

interface Props {
  userName: string
  noteGroup?: ForecasterNoteGroup
  logs: LogMessage[]
  taskRuns: TaskRun[]
  disseminations: LogDisplayDisseminationAction[]
  disseminationStatus: Record<string, LogDisseminationStatus>
}

const props = defineProps<Props>()
const availableWorkflows = useAvailableWorkflowsStore()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const taskRun = computed(() =>
  props.taskRuns.find((taskRun) => taskRun.taskId === props.logs[0].taskRunId),
)

const log = computed(() => props.logs[0])

const emit = defineEmits<LogActionEmit>()

function getTitleForLog(log: LogMessage, userName: string) {
  const workflowId = props.taskRuns.find(
    (taskRun) => taskRun.taskId === log.taskRunId,
  )?.workflowId

  const workflow = workflowId ? availableWorkflows.byId(workflowId) : undefined
  return workflow?.name ?? logToUser(log, userName)
}

const clickTimer = ref<NodeJS.Timeout | null>(null)

function onExpansionPanelToggle() {
  // discard double clicks
  if (clickTimer.value) {
    clearTimeout(clickTimer.value)
    clickTimer.value = null
  }
  clickTimer.value = setTimeout(() => {
    // Only expand when no text is selected
    if (window.getSelection()?.toString() === '') {
      expanded.value = !expanded.value
      clickTimer.value = null
    }
  }, 200)
}
</script>
