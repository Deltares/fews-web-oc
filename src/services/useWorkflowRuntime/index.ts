import { asyncComputed } from '@vueuse/core'
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useWorkflowRuntime(
  workflowId: MaybeRefOrGetter<string | null>,
) {
  const numAvailableServers = asyncComputed<number | null>(async () => {
    const _workflowId = toValue(workflowId)
    if (_workflowId === null) return null
    return fetchNumAvailableServers(_workflowId)
  })

  async function fetchRuntimePercentileInSeconds(
    workflowId: string,
    percentile: number,
  ): Promise<number> {
    // TODO: fetch percentiles of runtime in seconds for the specified workflow.
    const factor = parseFloat(workflowId.substring(workflowId.length - 1))
    return factor * percentile * 5 * 60
  }

  async function fetchNumAvailableServers(workflowId: string): Promise<number> {
    // TODO: fetch the number of servers available ofr the specified workflow.
    return 2 * parseFloat(workflowId.substring(workflowId.length - 1))
  }

  async function getRuntimeRangeInSeconds(
    lowerPercentile: number,
    upperPercentile: number,
  ): Promise<[number, number] | null> {
    const _workflowId = toValue(workflowId)
    if (_workflowId === null) return null

    const lower = await fetchRuntimePercentileInSeconds(
      _workflowId,
      lowerPercentile,
    )
    const upper = await fetchRuntimePercentileInSeconds(
      _workflowId,
      upperPercentile,
    )
    return [lower, upper]
  }

  return { getRuntimeRangeInSeconds, numAvailableServers }
}
