import uniq from 'lodash-es/uniq'
import { defineStore } from 'pinia'

import { fetchWorkflowsWithExpectedRunTime, Workflow } from '@/lib/workflows'

import { configManager } from '@/services/application-config'

interface AvailableWorkflowsState {
  workflows: Workflow[]
  preferredWorkflowIds: string[]
}

export const useAvailableWorkflowsStore = defineStore('availableWorkflows', {
  state: (): AvailableWorkflowsState => ({
    workflows: [],
    preferredWorkflowIds: [],
  }),
  getters: {
    workflowIds: (state) => {
      return state.workflows.map((workflow) => workflow.workflowId)
    },
  },
  actions: {
    byId(workflowId: string): Workflow {
      const workflow = this.workflows.find(
        (workflow) => workflow.workflowId === workflowId,
      )
      if (!workflow) {
        throw new Error(`No workflow with ID "{workflowId}" exists.`)
      }
      return workflow
    },
    async fetch() {
      const baseUrl = new URL(configManager.get('VITE_FEWS_WEBSERVICES_URL'))
      this.workflows = await fetchWorkflowsWithExpectedRunTime(baseUrl)
    },
    setPreferredWorkflowIds(workflowIds: string[]): void {
      // Make sure the workflow IDs are unique.
      const uniqueWorkflowIds = uniq(workflowIds)
      // Check whether all workflows exist by call the byId function for all of
      // them; this should error if the workflow does not exist.
      uniqueWorkflowIds.forEach((workflowId) => this.byId(workflowId))
      this.preferredWorkflowIds = uniqueWorkflowIds
    },
    clearPreferredWorkflowIds(): void {
      this.preferredWorkflowIds = []
    },
  },
})
