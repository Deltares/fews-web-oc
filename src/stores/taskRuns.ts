import { sortTasks, TaskRun } from '@/lib/taskruns'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useTaskRunsStore = defineStore('taskRuns', () => {
  const currentTaskRuns = ref<TaskRun[]>([])
  const selectedTaskRuns = ref<TaskRun[]>([])

  function getTaskRunById(taskId: string | undefined) {
    if (!taskId) return
    return (
      currentTaskRuns.value.find((tr) => tr.taskId === taskId) ??
      selectedTaskRuns.value.find((tr) => tr.taskId === taskId)
    )
  }

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

  function setCurrentTaskRuns(taskRuns: TaskRun[]) {
    currentTaskRuns.value = taskRuns
  }

  function taskRunIsSelected(taskRun: TaskRun) {
    return selectedTaskRuns.value.some((tr) => tr.taskId === taskRun.taskId)
  }

  function clearSelectedTaskRuns() {
    selectedTaskRuns.value = []
  }

  const sortedCurrentTaskRuns = computed(() =>
    currentTaskRuns.value.toSorted(sortTasks),
  )

  const sortedSelectedTaskRuns = computed(() =>
    selectedTaskRuns.value.toSorted(sortTasks),
  )

  const selectedTaskRunIds = computed(() =>
    sortedSelectedTaskRuns.value.map((taskRun) => taskRun.taskId),
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
