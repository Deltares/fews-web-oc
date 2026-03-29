import {
  DocumentFormat,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { toHumanReadableDateTime } from '@/lib/date'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  getTaskStatusCategory,
  type TaskRun,
  TaskStatusCategory,
} from '@/lib/taskruns'
import { uid } from '@/lib/utils/uid'

import { configManager } from '@/services/application-config'
import { useTaskRuns } from '@/services/useTaskRuns'

import { type Alert, useAlertsStore } from './alerts'
import { useAvailableWorkflowsStore } from './availableWorkflows'

export const useTaskRunMonitorStore = defineStore(
  'taskRunMonitor',
  () => {
    const POLL_INTERVAL_SECONDS = 10
    const TASK_RUN_ID_FROM_TASK_ID_DELAY_SECONDS = 1

    const { t } = useI18n()

    const alertsStore = useAlertsStore()
    const availableWorkflowsStore = useAvailableWorkflowsStore()

    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const provider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

    const monitoredTaskRunIds = ref<string[]>([])

    // We use the "taskruns" endpoint rather than the seemingly more obvious
    // "taskrunstatus" endpoint, as the former
    //    1. Allows us to specify multiple taskRunIds for a single request.
    //    2. Uses taskRunIds instead of taskIds, which are easier to work with
    //       in the existing code base.
    const { taskRuns } = useTaskRuns(
      baseUrl,
      () => ({ taskRunIds: monitoredTaskRunIds.value }),
      POLL_INTERVAL_SECONDS * 1000,
    )
    availableWorkflowsStore
      .waitForFetch()
      .then(() => {
        // We use the available workflows to obtain the name of the workflow to
        // show in the alert, these available workflows are fetched upon opening
        // the WebOC. This task run monitor is also started immediately, and we
        // may immediately fetch task run status updates for monitored
        // taskRunIds persisted in session storage. This status update may (and
        // often will) finish quicker than fetching the available workflows, in
        // which case we cannot generate a valid name in the notification.
        // Hence, we only setup the watcher for fetched task runs after the
        // available workflows have been fetched.
        // Note: this watcher cannot be cleaned up automatically, but we'll
        //       never need to clean it up as this store lives as long as the app.
        watch(
          taskRuns,
          (monitoredTaskRuns) =>
            monitoredTaskRuns.forEach((taskRun) => {
              try {
                handleTaskRun(taskRun)
              } catch (error) {
                console.error(
                  `Failed to monitor task run with taskRunId "${taskRun.taskRunId}": ${error}`,
                )
              }
            }),
          // Run immediately such that we can check task runs for taskRunIds
          // persisted in session storage.
          { immediate: true },
        )
      })
      .catch((error) =>
        console.error(`Failed to initialise task run monitor: ${error}`),
      )

    function handleTaskRun(taskRun: TaskRun): void {
      const statusCategory = getTaskStatusCategory(taskRun.status)
      const isCompleted = statusCategory === TaskStatusCategory.Completed
      const isFailed = statusCategory === TaskStatusCategory.Failed

      // Do nothing here, just keep monitoring tasks that haven't completed or
      // failed.
      if (!isCompleted && !isFailed) return

      // Add alert to show a notification to the user, then unfollow this task
      // run, as it will no longer change status.
      const alert = createAlert(taskRun, isCompleted)
      alertsStore.addAlert(alert)
      unfollow(taskRun.taskRunId)
    }

    function createAlert(taskRun: TaskRun, isCompleted: boolean): Alert {
      const type = isCompleted ? 'success' : 'error'

      const workflow = availableWorkflowsStore.byId(taskRun.workflowId)
      const name = workflow?.name ?? t('workflow.unknownWorkflow')
      const datetime = toHumanReadableDateTime(taskRun.dispatchTimestamp)
      const statusVerb = isCompleted ? t('common.finished') : t('common.failed')
      const message = t('workflow.taskRunFinishedMessage', {
        name,
        datetime,
        statusVerb,
      })

      return { id: uid(), type, message }
    }

    async function followByTaskId(taskId: string): Promise<void> {
      // We get a taskId, which is (obviously) different from a taskRunId. For
      // scheduled tasks, multiple taskRunIds can be created from a single
      // taskId. However, single-shot tasks (such as the what-if scenario runs
      // we are expecting here) will always have a unique taskId, which has a
      // unique associated taskRunId.
      // When a task is submitted, a taskId is created instantaneously, but a
      // taskRunId is only created when a task is assigned to a machine that
      // will run it. So we wait a bit for the creation of the taskRunId in FEWS
      // and then use the  taskrunstatus endpoint to get a taskRunId.
      await new Promise((resolve) =>
        setTimeout(resolve, TASK_RUN_ID_FROM_TASK_ID_DELAY_SECONDS * 1000),
      )
      const response = await provider.getTaskRunStatus({
        documentFormat: DocumentFormat.PI_JSON,
        taskId,
      })
      const taskRunId = response.taskRunId
      if (!taskRunId) {
        throw new Error(`Failed to get taskRunId for taskId "${taskId}"`)
      }
      follow(taskRunId)
    }

    function follow(taskRunId: string): void {
      if (monitoredTaskRunIds.value.includes(taskRunId)) return
      monitoredTaskRunIds.value = [...monitoredTaskRunIds.value, taskRunId]
    }

    function unfollow(taskRunId: string): void {
      monitoredTaskRunIds.value = monitoredTaskRunIds.value.filter(
        (id) => id !== taskRunId,
      )
    }

    function isFollowed(taskRunId: string): boolean {
      return monitoredTaskRunIds.value.includes(taskRunId)
    }

    return {
      monitoredTaskRunIds,
      followByTaskId,
      follow,
      unfollow,
      isFollowed,
    }
  },
  {
    persist: { storage: sessionStorage },
  },
)
