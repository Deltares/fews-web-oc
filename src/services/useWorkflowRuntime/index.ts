import { asyncComputed } from '@vueuse/core'
import { toValue, type MaybeRefOrGetter } from 'vue'

import { configManager } from '../application-config'
import { fetchWorkflowExpectedRuntimeInSeconds } from '@/lib/workflows/runtimes'

export function useWorkflowRuntime(
  workflowId: MaybeRefOrGetter<string | null>,
) {
  const baseUrl = new URL(configManager.get('VITE_FEWS_WEBSERVICES_URL'))

  const runtimeInSeconds = asyncComputed<number | null>(async () => {
    const _workflowId = toValue(workflowId)
    if (_workflowId === null) return null
    return fetchWorkflowExpectedRuntimeInSeconds(baseUrl, _workflowId)
  }, null)

  const numAvailableServers = asyncComputed<number | null>(async () => {
    const _workflowId = toValue(workflowId)
    if (_workflowId === null) return null
    return fetchNumAvailableServers(_workflowId)
  }, null)

  async function fetchNumAvailableServers(
    _workflowId: string,
  ): Promise<number> {
    // TODO: fetch the number of servers available ofr the specified workflow.
    return Math.round(5 * Math.random()) + 1
  }

  return { runtimeInSeconds, numAvailableServers }
}
