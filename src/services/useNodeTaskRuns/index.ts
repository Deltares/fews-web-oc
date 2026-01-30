import {
  inject,
  InjectionKey,
  MaybeRefOrGetter,
  provide,
  ref,
  Ref,
  toValue,
} from 'vue'
import { useTaskRuns } from '@/services/useTaskRuns'
import { configManager } from '@/services/application-config'
import { TaskStatus } from '@deltares/fews-pi-requests'
import type { TaskRun } from '@/lib/taskruns'

const KEY = Symbol('nodeTaskRuns') as InjectionKey<Ref<TaskRun[]>>

export function provideNodeTasks(
  topologyNodeId: MaybeRefOrGetter<string | undefined>,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

  const { taskRuns } = useTaskRuns(baseUrl, () => ({
    topologyNodeId: toValue(topologyNodeId),
    taskRunStatusIds: Object.values(TaskStatus),
    // Now minus a week
    startDispatchTime:
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19) + 'Z',
    forecastCount: 9999,
    startForecastTime:
      new Date('1970-01-01T00:00:00Z').toISOString().slice(0, 19) + 'Z',
    endForecastTime:
      new Date('2100-01-01T00:00:00Z').toISOString().slice(0, 19) + 'Z',
  }))

  provide(KEY, taskRuns)
}

export function useNodeTasks() {
  const fallBack = ref<TaskRun[]>([])
  return inject(KEY, fallBack)
}
