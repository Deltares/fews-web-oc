import { ModuleRuntimesResponse } from '@deltares/fews-pi-requests'
import { Workflow } from './types'
import { combineUrls } from '@/lib/utils/url'

export async function fetchWorkflowsWithExpectedRunTime(
  baseUrl: string,
): Promise<Workflow[]> {
  // Fetch workflows and runtimes in parallel.
  const [workflows, runTimes] = await Promise.all([
    fetchWorkflows(baseUrl),
    fetchWorkflowRuntimesInSeconds(baseUrl),
  ])

  // Set runtime field for each workflow.
  for (const workflow of workflows) {
    workflow.expectedRuntimeSeconds = runTimes[workflow.workflowId] ?? null
  }

  return workflows
}

export async function fetchWorkflows(baseUrl: string): Promise<Workflow[]> {
  // TODO: this should have
  //       a) JSON response
  //       b) a method in @deltares/fews-pi-requests
  const url = combineUrls(baseUrl, 'rest/fewspiservice/v1/workflows')
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch workflows.')
  }
  const text = await response.text()
  const root = new DOMParser().parseFromString(text, 'text/xml')

  const workflowElements = root.querySelectorAll('workflow')

  const workflows: Workflow[] = []
  for (const element of workflowElements) {
    const workflowId = element.getAttribute('id') ?? ''
    const name = element.querySelector('name')?.textContent ?? ''
    const description = element.querySelector('description')?.textContent ?? ''
    workflows.push({
      workflowId,
      name,
      description,
      expectedRuntimeSeconds: null,
    })
  }

  return workflows
}

export async function fetchWorkflowRuntimesInSeconds(
  baseUrl: string,
): Promise<Record<string, number>> {
  // TODO: add moduleruntimes endpoint to @deltares/fews-pi-requests
  const url = new URL(
    combineUrls(baseUrl, 'rest/fewspiservice/v1/moduleruntimes'),
  )
  url.searchParams.append('documentFormat', 'PI_JSON')

  const response = await fetch(url)
  const data: ModuleRuntimesResponse = await response.json()

  // Runtimes are returned per module, a workflow may consist of multiple
  // modules. We sum the results for all modules in a workflow to obtain the
  // expected runtime for a complete workflow.
  const availableWorkflowIds = new Set(
    data.moduleRunTimes.map((runTime) => runTime.workflowId),
  )

  const runTimes: Record<string, number> = {}
  for (const workflowId of availableWorkflowIds) {
    // Find module runtimes for this workflow, then sum the results.
    const currentRunTimes = data.moduleRunTimes.filter(
      (runTime) => runTime.workflowId === workflowId,
    )
    // Runtimes are returned in milliseconds, convert to seconds.
    const totalRuntimeSeconds = currentRunTimes.reduce(
      (prev, cur) => prev + cur.expectedRunningDuration / 1000,
      0,
    )
    runTimes[workflowId] = totalRuntimeSeconds
  }
  return runTimes
}
