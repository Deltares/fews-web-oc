<template>
  <v-data-table
    :headers="headers"
    :no-data-text="noDataText"
    :items="runningTasks"
    :footer-props="{
      itemsPerPageOptions: [50, 100, 150],
    }"
    sticky
    class="elevation-1"
  >
    <template v-slot:item.status="{ item }">
      <v-chip size="small" :color="getColor(item.status)">
        {{ item.status }}
      </v-chip>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import {
  DocumentFormat,
  PiWebserviceProvider,
  TaskRun,
  TaskRunsFilter,
  TaskRunsResponse,
} from '@deltares/fews-pi-requests'
import { configManager } from '../../services/application-config'
import { onMounted, onUnmounted, ref } from 'vue'
import { type VDataTable } from 'vuetify/components'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
type ReadonlyDataTableHeader = (typeof VDataTable)['headers']

const props = defineProps(['timeOut'])

let noDataText = ref('Loading data..')
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

onUnmounted(() => {
  active = false
})

const headers: ReadonlyDataTableHeader[] = [
  { title: 'Task run id', key: 'id' },
  { title: 'Description', key: 'description' },
  { title: 'Workflow id', key: 'workflowId' },
  { title: 'Dispatch time', key: 'dispatchTime' },
  { title: 'FSS id', key: 'fssId' },
  { title: 'Status', key: 'status' },
  { title: 'FDO', key: 'user' },
]
let runningTasks = ref<TaskRun[]>([])
let active: boolean = false
onMounted(() => {
  active = true
  loadRunningTasks()
})

function getColor(status: any): string {
  switch (status) {
    case 'pending':
      return 'light-gray'
    case 'running':
      return '#d0e9c6'
    default:
      return 'white'
  }
}

async function loadRunningTasks() {
  try {
    if (!active) return

    const taskRunFilter: TaskRunsFilter = {
      taskRunStatusIds: ['R', 'P'],
      documentFormat: DocumentFormat.PI_JSON,
      onlyForecasts: false,
    }
    const res: TaskRunsResponse =
      await webServiceProvider.getTaskRuns(taskRunFilter)
    runningTasks.value = res.taskRuns
    noDataText.value = 'There are no running or pending tasks'
  } catch (error) {
    console.warn(error)
  } finally {
    setTimeout(loadRunningTasks, props.timeOut)
  }
}
</script>

<style scoped></style>
