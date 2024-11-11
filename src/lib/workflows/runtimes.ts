import { ModuleRuntimesResponse } from '@deltares/fews-pi-requests'

export async function fetchWorkflowExpectedRuntimeInSeconds(
  baseUrl: URL,
  workflowId: string,
): Promise<number> {
  // TODO: add moduleruntimes endpoint to @deltares/fews-pi-requests
  const url = new URL('rest/fewspiservice/v1/moduleruntimes', baseUrl)
  url.searchParams.append('documentFormat', 'PI_JSON')
  url.searchParams.append('workflowId', workflowId)

  const response = await fetch(url)
  const data: ModuleRuntimesResponse = await response.json()

  // Sum the duration of all modules of this workflow.
  const totalRuntimeSeconds = data.moduleRunTimes.reduce(
    (prev, cur) => prev + cur.expectedRunningDuration,
    0,
  )
  return totalRuntimeSeconds
}
