import {
  PiWebserviceProvider,
  type ExportStatus,
  type ImportStatus,
} from '@deltares/fews-pi-requests'
import { ref } from 'vue'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import type { ImportExportStatusItem } from './statusTypes'

interface UseImportExportStatusOptions {
  pollIntervalMs: number
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export function normalizeStatuses(
  items: (ImportStatus | ExportStatus)[],
  statusType: 'import' | 'export',
): ImportExportStatusItem[] {
  return items.map((item) => ({
    ...item,
    statusType,
  }))
}

export function useImportExportStatus(options: UseImportExportStatusOptions) {
  const statusItems = ref<ImportExportStatusItem[]>([])
  let active = false
  let timer: ReturnType<typeof setTimeout> | undefined

  function stopPolling() {
    active = false
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  async function loadStatuses() {
    try {
      if (!active) return

      const [importResult, exportResult] = await Promise.allSettled([
        webServiceProvider.getImportStatus(),
        webServiceProvider.getExportStatus(),
      ])

      const importItems =
        importResult.status === 'fulfilled'
          ? normalizeStatuses(importResult.value.importStatus, 'import')
          : []
      const exportItems =
        exportResult.status === 'fulfilled'
          ? normalizeStatuses(exportResult.value.exportStatus, 'export')
          : []

      statusItems.value = [...importItems, ...exportItems]
    } catch (error) {
      console.warn(error)
    } finally {
      if (active) {
        timer = setTimeout(loadStatuses, options.pollIntervalMs)
      }
    }
  }

  async function startPolling() {
    if (active) return
    active = true
    await loadStatuses()
  }

  return {
    statusItems,
    startPolling,
    stopPolling,
  }
}
