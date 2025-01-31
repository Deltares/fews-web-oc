import {
  DocumentFormat,
  ModuleRunTime,
  PiWebserviceProvider,
  Workflow,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '../requests/transformRequest'
import { WorkflowItem } from './types'

export async function fetchWorkflowsWithExpectedRunTime(): Promise<
  WorkflowItem[]
> {
  // Fetch workflows and runtimes in parallel.
  const [workflows, runTimes] = await Promise.all([
    fetchWorkflows(),
    fetchModuleRuntimes(),
  ])

  const workflowIdToRunTimeSecondsMap =
    getWorkflowIdToRunTimeSecondsMap(runTimes)

  return workflows.map((workflow) => ({
    ...workflow,
    expectedRuntimeSeconds: workflowIdToRunTimeSecondsMap[workflow.id] ?? null,
  }))
}

function getWorkflowIdToRunTimeSecondsMap(
  runTimes: ModuleRunTime[],
): Record<string, number> {
  const availableWorkflowIds = new Set(
    runTimes.map((runTime) => runTime.workflowId),
  )

  const runTimeMap: Record<string, number> = {}
  for (const workflowId of availableWorkflowIds) {
    const currentRunTimes = runTimes.filter(
      (runTime) => runTime.workflowId === workflowId,
    )
    const totalRuntimeSeconds = currentRunTimes.reduce(
      (prev, cur) => prev + cur.expectedRunningDuration / 1000,
      0,
    )
    runTimeMap[workflowId] = totalRuntimeSeconds
  }

  return runTimeMap
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  try {
    const response = await piProvider.getWorkflows({
      documentFormat: DocumentFormat.PI_JSON,
    })
    return response.workflows
  } catch (error) {
    console.error(error)
  }

  return []
}

export async function fetchModuleRuntimes(): Promise<ModuleRunTime[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  try {
    const response = await piProvider.getModuleRunTimes({
      documentFormat: DocumentFormat.PI_JSON,
    })
    return response.moduleRunTimes
  } catch (error) {
    console.error(error)
  }

  return []
}
