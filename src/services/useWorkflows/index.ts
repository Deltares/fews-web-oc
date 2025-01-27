import { asyncComputed } from '@vueuse/core'

import { fetchWorkflows } from '@/lib/workflows/fetch'
import { Workflow } from '@/lib/workflows/types'

import { configManager } from '@/services/application-config'
import { computed } from 'vue'

export function useWorkflows() {
  const baseUrl = new URL(configManager.get('VITE_FEWS_WEBSERVICES_URL'))

  const workflows = asyncComputed<Workflow[]>(() => fetchWorkflows(baseUrl), [])
  const whatIfTemplateIds = computed<string[]>(() =>
    workflows.value.flatMap((workflow) =>
      workflow.whatIfTemplateId ? [workflow.whatIfTemplateId] : [],
    ),
  )

  function byId(workflowId: string): Workflow {
    const workflow = workflows.value.find(
      (workflow) => workflow.workflowId === workflowId,
    )
    if (!workflow) {
      throw new Error(`Workflow with ID "${workflowId}" does not exist.`)
    }
    return workflow
  }

  return { byId, workflows, whatIfTemplateIds }
}
