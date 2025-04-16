import { TaskRun } from '@/lib/taskruns'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useTaskRunsStore = defineStore('taskRuns', () => {
  const selectedTaskRuns = ref<TaskRun[]>([])

  function toggleTaskRun(taskRun: TaskRun) {
    const index = selectedTaskRuns.value.findIndex(
      (tr) => tr.taskId === taskRun.taskId,
    )
    if (index === -1) {
      selectedTaskRuns.value.push(taskRun)
    } else {
      selectedTaskRuns.value.splice(index, 1)
    }
  }

  function taskRunIsSelected(taskRun: TaskRun) {
    return selectedTaskRuns.value.some((tr) => tr.taskId === taskRun.taskId)
  }

  function clearTaskRuns() {
    selectedTaskRuns.value = []
  }

  const selectedTaskRunIds = computed(() =>
    selectedTaskRuns.value
      .toSorted((a, b) => a.timeZeroTimestamp - b.timeZeroTimestamp)
      .reverse()
      .map((taskRun) => taskRun.taskId),
  )

  return {
    selectedTaskRuns,
    selectedTaskRunIds,
    taskRunIsSelected,
    toggleTaskRun,
    clearTaskRuns,
  }
})
