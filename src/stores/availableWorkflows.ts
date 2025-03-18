import { ref, computed } from 'vue'
import uniq from 'lodash-es/uniq'
import { defineStore } from 'pinia'
import {
  fetchWorkflowsWithExpectedRunTime,
  WorkflowItem,
} from '@/lib/workflows'

export const useAvailableWorkflowsStore = defineStore(
  'availableWorkflows',
  () => {
    const workflows = ref<WorkflowItem[]>([])
    const preferredWorkflowIds = ref<string[]>([])

    const workflowIds = computed(() => {
      return workflows.value.map((workflow) => workflow.id)
    })

    const whatIfWorkflows = computed(() => {
      return workflows.value.filter(
        (workflow) => workflow.whatIfTemplateId !== undefined,
      )
    })

    const whatIfTemplateIds = computed(() => {
      return workflows.value.flatMap((workflow) =>
        workflow.whatIfTemplateId ? [workflow.whatIfTemplateId] : [],
      )
    })

    function byId(workflowId: string) {
      const workflow = workflows.value.find(
        (workflow) => workflow.id === workflowId,
      )
      return workflow
    }

    function byWhatIfTemplateId(whatIfTemplateId: string) {
      const workflow = workflows.value.find(
        (workflow) => workflow.whatIfTemplateId === whatIfTemplateId,
      )
      return workflow
    }

    function hasWhatIfTemplate(workflowId: string): boolean {
      return byId(workflowId)?.whatIfTemplateId !== undefined
    }

    async function fetch() {
      workflows.value = await fetchWorkflowsWithExpectedRunTime()
    }

    function setPreferredWorkflowIds(workflowIds: string[]): void {
      // Make sure the workflow IDs are unique.
      const uniqueWorkflowIds = uniq(workflowIds)
      // Check whether all workflows exist by call the byId function for all of
      // them; this should error if the workflow does not exist.
      uniqueWorkflowIds.forEach((workflowId) => byId(workflowId))
      preferredWorkflowIds.value = uniqueWorkflowIds
    }

    function clearPreferredWorkflowIds(): void {
      preferredWorkflowIds.value = []
    }

    // Fetch metadata for all available workflows.
    fetch().catch(() => console.error('Failed to fetch available workflows.'))

    return {
      workflows,
      preferredWorkflowIds,
      workflowIds,
      whatIfWorkflows,
      whatIfTemplateIds,
      byId,
      byWhatIfTemplateId,
      hasWhatIfTemplate,
      fetch,
      setPreferredWorkflowIds,
      clearPreferredWorkflowIds,
    }
  },
)
