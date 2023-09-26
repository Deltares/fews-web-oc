<template>
  <v-data-table
    :headers="headers"
    :no-data-text="noDataText"
    :items="runningTasks"
    :footer-props="{
      'items-per-page-options': [50, 100, 150],
    }"
    class="elevation-1"
  >
    <template v-slot:item.columns.status="{ item }">
      <v-chip :color="getColor(item.columns.status)">
        {{ item.columns.status }}
      </v-chip>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { VDataTable } from 'vuetify/labs/VDataTable'

import {
  DocumentFormat,
  PiWebserviceProvider,
  TaskRun,
  TaskRunsFilter,
  TaskRunsResponse,
} from '@deltares/fews-pi-requests'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.ts'
import { configManager } from '../../services/application-config'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
  ? UnwrapReadonlyArrayType<I>
  : A
type DT = InstanceType<typeof VDataTable>
type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

const props = defineProps(['timeOut'])

let noDataText = ref('Loading data..')
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const transformRequestFn = (request: Request) =>
  Promise.resolve(authenticationManager.transformRequestAuth(request))
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn,
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
  console.log(status)
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
    console.log(error)
  } finally {
    setTimeout(loadRunningTasks, props.timeOut)
  }
}
</script>

<style scoped></style>
