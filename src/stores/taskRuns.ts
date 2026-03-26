import { sortTasks, TaskRun } from '@/lib/taskruns'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useTaskRunsStore = defineStore('taskRuns', () => {
  const currentTaskRuns = ref<TaskRun[]>([])
  const selectedTaskRuns = ref<TaskRun[]>([])

  function getTaskRunById(taskRunId: string | undefined) {
    if (!taskRunId) return
    return (
      currentTaskRuns.value.find((tr) => tr.taskRunId === taskRunId) ??
      selectedTaskRuns.value.find((tr) => tr.taskRunId === taskRunId)
    )
  }

  function toggleTaskRun(taskRun: TaskRun) {
    const index = selectedTaskRuns.value.findIndex(
      (tr) => tr.taskRunId === taskRun.taskRunId,
    )
    if (index === -1) {
      selectedTaskRuns.value.push(taskRun)
    } else {
      selectedTaskRuns.value.splice(index, 1)
    }
  }

  function setCurrentTaskRuns(taskRuns: TaskRun[]) {
    currentTaskRuns.value = taskRuns
  }

  function taskRunIsSelected(taskRun: TaskRun) {
    return selectedTaskRuns.value.some(
      (tr) => tr.taskRunId === taskRun.taskRunId,
    )
  }

  function clearSelectedTaskRuns() {
    // Avoid unnecessary reactivity
    if (selectedTaskRuns.value.length === 0) return
    selectedTaskRuns.value = []
  }
  const sortedCurrentTaskRuns = computed(() =>
    currentTaskRuns.value.toSorted(sortTasks),
  )

  const sortedSelectedTaskRuns = computed(() =>
    selectedTaskRuns.value.toSorted(sortTasks),
  )

  const selectedTaskRunIds = computed(() =>
    sortedSelectedTaskRuns.value.map((taskRun) => taskRun.taskRunId),
  )

  return {
    currentTaskRuns,
    selectedTaskRuns,
    selectedTaskRunIds,
    sortedCurrentTaskRuns,
    sortedSelectedTaskRuns,
    getTaskRunById,
    setCurrentTaskRuns,
    taskRunIsSelected,
    toggleTaskRun,
    clearSelectedTaskRuns,
  }
})
