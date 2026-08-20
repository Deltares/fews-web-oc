import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const statusTypesPath = resolve(
  process.cwd(),
  'src/components/systemmonitor/statusTypes.ts',
)
const importStatusControlPath = resolve(
  process.cwd(),
  'src/components/systemmonitor/ImportStatusControl.vue',
)
const importExportStatusComposablePath = resolve(
  process.cwd(),
  'src/components/systemmonitor/useImportExportStatus.ts',
)
const importStatusSummaryPath = resolve(
  process.cwd(),
  'src/components/systemmonitor/ImportStatusSummary.vue',
)
const logSidePanelPath = resolve(
  process.cwd(),
  'src/components/sidepanel/LogSidePanel.vue',
)

function read(path: string): string {
  return readFileSync(path, 'utf-8')
}

describe('Import/Export status requirements contract', () => {
  it('defines shared import/export status source model', () => {
    const source = read(statusTypesPath)

    expect(source).toContain("export type StatusSource = 'import' | 'export'")
    expect(source).toContain('export interface ImportExportStatusItem')
    expect(source).toContain('statusType: StatusSource')
  })

  it('loads both import and export statuses and merges rows', () => {
    const source = read(importExportStatusComposablePath)

    expect(source).toContain('Promise.allSettled([')
    expect(source).toContain('webServiceProvider.getImportStatus()')
    expect(source).toContain('webServiceProvider.getExportStatus()')
    expect(source).toContain(
      'normalizeStatuses(importResult.value.importStatus, \"import\")'.replace(
        /\"/g,
        "'",
      ),
    )
    expect(source).toContain(
      'normalizeStatuses(exportResult.value.exportStatus, \"export\")'.replace(
        /\"/g,
        "'",
      ),
    )
    expect(source).toContain(
      'statusItems.value = [...importItems, ...exportItems]',
    )
  })

  it('uses shared import/export status composable in control panel', () => {
    const source = read(importStatusControlPath)

    expect(source).toContain(
      "import { useImportExportStatus } from './useImportExportStatus'",
    )
    expect(source).toContain(
      'const { statusItems, startPolling, stopPolling } = useImportExportStatus({',
    )
  })

  it('keeps source and result filters for the status panel', () => {
    const source = read(importStatusControlPath)

    expect(source).toContain(
      "const selectedSources = ref<StatusSource[]>(['import', 'export'])",
    )
    expect(source).toContain(
      "const selectedResults = ref<StatusResultFilter[]>([\n  'successful',\n  'unsuccessful',\n])",
    )
    expect(source).toContain(
      'const sourceMatches = selectedSources.value.includes(item.statusType)',
    )
    expect(source).toContain(
      "item.filesFailedCount > 0 ? 'unsuccessful' : 'successful'",
    )
    expect(source).toContain(
      'const resultMatches = selectedResults.value.includes(resultType)',
    )
  })

  it('opens logs from taskRunId click and emits selected id', () => {
    const source = read(importStatusSummaryPath)

    expect(source).toContain('@click.stop="onTaskRunIdClick(item.taskRunId)"')
    expect(source).toContain("emit('openLogTaskRun', normalizedTaskRunId)")
  })

  it('shows logs-unavailable tooltip behavior with toggle and auto-hide', () => {
    const source = read(importStatusSummaryPath)

    expect(source).toContain('text="Logs not found"')
    expect(source).toContain(
      'showLogsNotFoundTooltip.value = !showLogsNotFoundTooltip.value',
    )
    expect(source).toContain('setTimeout(() => {')
    expect(source).toContain('showLogsNotFoundTooltip.value = false')
    expect(source).toContain('}, 2000)')
  })

  it('shows optional expanded fields only when backend populates values', () => {
    const source = read(importStatusSummaryPath)

    expect(source).toContain('<v-list-item v-if="hasText(item.taskRunId)">')
    expect(source).toContain('<v-list-item v-if="hasText(item.workflowId)">')
    expect(source).toContain('<v-list-item v-if="hasText(item.workflowName)">')
    expect(source).toContain('<v-list-item v-if="hasText(item.status)">')
  })

  it('implements strict feed meta rules for name/description fallback', () => {
    const source = read(importStatusSummaryPath)

    expect(source).toContain('const hasName = hasText(item.dataFeedName)')
    expect(source).toContain(
      'const hasDescription = hasText(item.dataFeedDescription)',
    )
    expect(source).toContain('const hasFeed = hasText(item.dataFeed)')
    expect(source).toContain(
      'const useFallback = !hasName && hasDescription && hasFeed',
    )
    expect(source).toContain("label: 'Data feed name'")
    expect(source).toContain("label: 'Data feed'")
    expect(source).toContain('visible: false')
  })

  it('filters logs by selected taskRunId in logs panel', () => {
    const source = read(logSidePanelPath)

    expect(source).toContain(
      'const selectedTaskRunId = computed(() => props.settings.taskRunId?.trim() ?? \"\")'.replace(
        /\"/g,
        "'",
      ),
    )
    expect(source).toContain(
      '(!selectedTaskRunId.value || log.taskRunId === selectedTaskRunId.value)',
    )
  })
})
