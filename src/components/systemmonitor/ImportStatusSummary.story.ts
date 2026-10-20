import { defineComponent, h, ref } from 'vue'
import ImportStatusSummary from './ImportStatusSummary.vue'
import type { ImportExportStatusItem } from './statusTypes'
import { useConfigStore } from '@/stores/config'
import { configManager } from '@/services/application-config'

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

type LogDisplayMode = 'system' | 'manual' | 'disabled'

function configureLogPanel(enabled: boolean, mode: LogDisplayMode = 'system') {
  configManager.update({
    VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews`,
  })

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

  const originalFetch = window.fetch.bind(window)
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    let payload: { logDisplays: Array<Record<string, unknown>> }

    if (mode === 'system') {
      payload = {
        logDisplays: [
          {
            id: 'log-display-1',
            name: 'system-enabled',
            manualLog: { noteGroupId: 'notes-1' },
            systemLog: { logLevel: 'INFO' },
          },
        ],
      }
    } else if (mode === 'manual') {
      payload = {
        logDisplays: [
          {
            id: 'log-display-1',
            name: 'manual-only',
            manualLog: { noteGroupId: 'notes-1' },
          },
        ],
      }
    } else {
      payload = { logDisplays: [] }
    }

    let url: string

    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.toString()
    } else {
      url = input.url
    }

    if (
      url.includes('logDisplays') ||
      url.includes('logDisplay') ||
      url.includes('fews')
    ) {
      return Promise.resolve(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }

    return originalFetch(input, init)
  }) as typeof window.fetch
}

export const LogsEnabled = defineComponent(() => {
  const expanded = ref(true)
  const emittedTaskRunId = ref<string>()

  configureLogPanel(true, 'system')

  return () =>
    h('div', [
      h(ImportStatusSummary, {
        item: { ...baseItem, taskRunId: '  task-run-1  ' },
        expanded: expanded.value,
        'onUpdate:expanded': (value: boolean) => {
          expanded.value = value
        },
        onOpenSidePanel: (request) => {
          if (request.type === 'logDisplay') {
            emittedTaskRunId.value = request.props?.taskRunId
          }
        },
      }),
      h('div', { 'data-testid': 'emitted-task-run' }, emittedTaskRunId.value),
    ])
})

export const ManualOnlyLogs = defineComponent(() => {
  const expanded = ref(true)

  configureLogPanel(true, 'manual')

  return () =>
    h(ImportStatusSummary, {
      item: { ...baseItem, taskRunId: 'task-run-3' },
      expanded: expanded.value,
      'onUpdate:expanded': (value: boolean) => {
        expanded.value = value
      },
    })
})

export const LogsDisabled = defineComponent(() => {
  const expanded = ref(true)
  const emittedTaskRunId = ref<string>()

  configureLogPanel(false, 'disabled')

  return () =>
    h('div', [
      h(ImportStatusSummary, {
        item: { ...baseItem, taskRunId: 'task-run-2' },
        expanded: expanded.value,
        'onUpdate:expanded': (value: boolean) => {
          expanded.value = value
        },
        onOpenSidePanel: (request) => {
          if (request.type === 'logDisplay') {
            emittedTaskRunId.value = request.props?.taskRunId
          }
        },
      }),
      h('div', { 'data-testid': 'emitted-task-run' }, emittedTaskRunId.value),
    ])
})

export const OptionalFieldsMissing = defineComponent(() => {
  const expanded = ref(true)

  configureLogPanel(true, 'system')

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
