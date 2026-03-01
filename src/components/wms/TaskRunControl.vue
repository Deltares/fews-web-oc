<template>
  <ControlChip v-if="numberOfTaskRuns > 0" :class="{ 'pr-0': taskRunId }">
    <v-btn
      variant="plain"
      density="compact"
      @click="toggleTaskRunId"
      :icon="
        taskRunId ? 'mdi-chart-box-multiple' : 'mdi-chart-box-multiple-outline'
      "
    />
    <v-menu v-if="taskRunId" transition="slide-y-transition">
      <template #activator="{ props, isActive }">
        <TaskRunControlItem
          v-bind="props"
          aria-label="Select Task Run"
          variant="text"
          density="compact"
          class="text-capitalize px-2"
          :item="selectedTaskRun"
        >
          <template #append>
            <SelectIcon :active="isActive" />
          </template>
        </TaskRunControlItem>
      </template>
      <v-list density="compact">
        <v-list-subheader>Current</v-list-subheader>
        <TaskRunControlItem
          v-for="item in currentTaskRuns"
          :key="item.taskId"
          @click="taskRunId = item?.taskId"
          :active="item?.taskId === taskRunId"
          :item="item"
        />
        <v-list-subheader>Non Current</v-list-subheader>
        <TaskRunControlItem
          v-for="item in taskRuns"
          :key="item.taskId"
          :item="item"
          @click="taskRunId = item?.taskId"
          :active="item?.taskId === taskRunId"
        />
      </v-list>
    </v-menu>
  </ControlChip>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
import SelectIcon from '@/components/general/SelectIcon.vue'
import TaskRunControlItem from '@/components/wms/TaskRunControlItem.vue'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { computed, watch } from 'vue'

const taskRunId = defineModel<string>('taskRunId')

const taskRunsStore = useTaskRunsStore()

const currentTaskRuns = computed(() => taskRunsStore.currentTaskRuns)
const taskRuns = computed(() => taskRunsStore.sortedSelectedTaskRuns)

const selectedTaskRun = computed(() =>
  taskRunsStore.getTaskRunById(taskRunId.value),
)

const numberOfTaskRuns = computed(() => taskRuns.value.length)

watch(numberOfTaskRuns, (newNumberOfTaskRuns, oldNumberOfTaskRuns) => {
  if (newNumberOfTaskRuns > 0 && oldNumberOfTaskRuns == 0) {
    taskRunId.value = taskRuns.value[0].taskId
  }
})

watch(
  taskRuns,
  (newRuns) => {
    if (
      taskRunId.value &&
      !newRuns.find((taskRun) => taskRun.taskId === taskRunId.value)
    ) {
      taskRunId.value = newRuns[0]?.taskId
    }
  },
  { deep: true },
)

let lastSelectedTaskRunId: string | undefined = undefined

function toggleTaskRunId() {
  if (taskRunId.value === undefined) {
    if (
      lastSelectedTaskRunId &&
      taskRuns.value.find((t) => t.taskId === lastSelectedTaskRunId)
    ) {
      taskRunId.value = lastSelectedTaskRunId
    } else {
      taskRunId.value = taskRuns.value[0]?.taskId
    }
  } else {
    lastSelectedTaskRunId = taskRunId.value
    taskRunId.value = undefined
  }
}
</script>
