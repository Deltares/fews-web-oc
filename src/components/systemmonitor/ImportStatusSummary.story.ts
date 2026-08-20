import { defineComponent, h, ref } from 'vue'
import ImportStatusSummary from './ImportStatusSummary.vue'
import type { ImportExportStatusItem } from './statusTypes'
import { useConfigStore } from '@/stores/config'

const baseItem: ImportExportStatusItem = {
  mcId: 'mc-1',
  taskRunId: 'task-run-1',
  workflowId: 'wf-1',
  workflowName: 'Workflow 1',
  directory: '/import/dir',
  dataFeed: 'feed-1',
  dataFeedName: 'Feed Name 1',
  dataFeedDescription: 'Feed description 1',
  lastSuccessfulTime: '2026-01-01T12:00:00Z',
  lastSuccessfulFile: 'last-successful-file.csv',
  filesSuccessfulCount: 4,
  filesFailedCount: 1,
  status: 'OK',
  statusType: 'import',
}

function configureLogPanel(enabled: boolean) {
  const configStore = useConfigStore()
  configStore.general = {
    ...configStore.general,
    sidePanel: {
      ...configStore.general.sidePanel,
      logDisplay: {
        enabled,
        logDisplayId: 'log-display-1',
      },
    },
  }
}

export const LogsEnabled = defineComponent(() => {
  const expanded = ref(true)
  const emittedTaskRunId = ref('')

  configureLogPanel(true)

  return () =>
    h('div', [
      h(ImportStatusSummary, {
        item: { ...baseItem, taskRunId: '  task-run-1  ' },
        expanded: expanded.value,
        'onUpdate:expanded': (value: boolean) => {
          expanded.value = value
        },
        onOpenLogTaskRun: (taskRunId: string) => {
          emittedTaskRunId.value = taskRunId
        },
      }),
      h('div', { 'data-testid': 'emitted-task-run' }, emittedTaskRunId.value),
    ])
})

export const LogsDisabled = defineComponent(() => {
  const expanded = ref(true)
  const emittedTaskRunId = ref('')

  configureLogPanel(false)

  return () =>
    h('div', [
      h(ImportStatusSummary, {
        item: { ...baseItem, taskRunId: 'task-run-2' },
        expanded: expanded.value,
        'onUpdate:expanded': (value: boolean) => {
          expanded.value = value
        },
        onOpenLogTaskRun: (taskRunId: string) => {
          emittedTaskRunId.value = taskRunId
        },
      }),
      h('div', { 'data-testid': 'emitted-task-run' }, emittedTaskRunId.value),
    ])
})

export const OptionalFieldsMissing = defineComponent(() => {
  const expanded = ref(true)

  configureLogPanel(true)

  return () =>
    h(ImportStatusSummary, {
      item: {
        ...baseItem,
        taskRunId: undefined,
        workflowId: ' ',
        workflowName: '',
        status: undefined,
        dataFeedName: ' ',
        dataFeedDescription: '',
      },
      expanded: expanded.value,
      'onUpdate:expanded': (value: boolean) => {
        expanded.value = value
      },
    })
})
