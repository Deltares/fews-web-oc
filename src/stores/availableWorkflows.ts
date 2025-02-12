import uniq from 'lodash-es/uniq'
import { defineStore } from 'pinia'

import {
  fetchWorkflowsWithExpectedRunTime,
  WorkflowItem,
} from '@/lib/workflows'

interface AvailableWorkflowsState {
  workflows: WorkflowItem[]
  preferredWorkflowIds: string[]
}

export const useAvailableWorkflowsStore = defineStore('availableWorkflows', {
  state: (): AvailableWorkflowsState => ({
    workflows: [],
    preferredWorkflowIds: [],
  }),
  getters: {
    workflowIds: (state) => {
      return state.workflows.map((workflow) => workflow.id)
    },
  },
  actions: {
    byId(workflowId: string): WorkflowItem {
      const workflow = this.workflows.find(
        (workflow) => workflow.id === workflowId,
      )
      if (!workflow) {
        throw new Error(`No workflow with ID "{workflowId}" exists.`)
      }
      return workflow
    },
    async fetch() {
      this.workflows = await fetchWorkflowsWithExpectedRunTime()
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
