import { asyncComputed } from '@vueuse/core'

import { fetchWorkflows } from '@/lib/workflows/fetch'
import { Workflow } from '@/lib/workflows/types'

import { configManager } from '@/services/application-config'

export function useWorkflows() {
  const baseUrl = new URL(configManager.get('VITE_FEWS_WEBSERVICES_URL'))

  const workflows = asyncComputed<Workflow[]>(() => fetchWorkflows(baseUrl), [])

  return { workflows }
}
