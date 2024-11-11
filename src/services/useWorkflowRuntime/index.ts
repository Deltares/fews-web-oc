import { asyncComputed } from '@vueuse/core'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useWorkflowRuntime(
  workflowId: MaybeRefOrGetter<string | null>,
) {
  const runtimeInSeconds = computed<number | null>(() => 5)

  const numAvailableServers = asyncComputed<number | null>(async () => {
    const _workflowId = toValue(workflowId)
    if (_workflowId === null) return null
    return fetchNumAvailableServers(_workflowId)
  })

  async function fetchNumAvailableServers(
    _workflowId: string,
  ): Promise<number> {
    // TODO: fetch the number of servers available ofr the specified workflow.
    return Math.round(5 * Math.random()) + 1
  }

  return { runtimeInSeconds, numAvailableServers }
}
