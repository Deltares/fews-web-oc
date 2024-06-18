import {
  PiWebserviceProvider,
  ProcessDataFilter,
  RunTaskFilter,
} from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'

import { downloadFileWithXhr } from '@/lib/download'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import { BoundingBox } from '@/services/useBoundingBox'

interface WorkflowsState {
  workflowId: string | null
  startTime: string | null
  endTime: string | null
  numActiveWorkflows: number
  boundingBox: BoundingBox | null
  isDrawingBoundingBox: boolean
}

export enum WorkflowType {
  RunTask = 'RunTask',
  ProcessData = 'ProcessData',
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

type OmitForWorkflow<T> = Omit<T, 'workflowId' | 'startTime' | 'endTime'>
export type PartialRunTaskFilter = OmitForWorkflow<RunTaskFilter>
export type PartialProcessDataFilter = OmitForWorkflow<ProcessDataFilter>

export interface StartWorkflowOptions {
  body?: string
  fileName?: string
}

const useWorkflowsStore = defineStore('workflows', {
  state: (): WorkflowsState => ({
    workflowId: null,
    startTime: null,
    endTime: null,
    numActiveWorkflows: 0,
    boundingBox: null,
    isDrawingBoundingBox: false,
  }),

  actions: {
    async startWorkflow(
      type: WorkflowType,
      filter: PartialRunTaskFilter | PartialProcessDataFilter,
      options?: StartWorkflowOptions,
    ) {
      if (this.workflowId === null) {
        throw Error('Workflow ID has not been set.')
      }
      if (this.startTime === null || this.endTime === null) {
        throw Error('Start time or end time has not been set.')
      }

      this.numActiveWorkflows++

      // Add workflowId, startTime, and endTime from the store to the incomplete
      // filter.
      const completeFilter: RunTaskFilter | ProcessDataFilter = {
        ...filter,
        workflowId: this.workflowId,
        startTime: this.startTime,
        endTime: this.endTime,
      }
      try {
        if (type === WorkflowType.RunTask) {
          await webServiceProvider.postRunTask(
            completeFilter as RunTaskFilter,
            options?.body ?? '',
          )
        } else if (type === WorkflowType.ProcessData) {
          const url = webServiceProvider.processDataUrl(
            completeFilter as ProcessDataFilter,
          )
          await downloadFileWithXhr(url.toString(), options?.fileName)
        }
      } finally {
        this.numActiveWorkflows--
      }
    },
  },

  getters: {
    hasActiveWorkflows: (state) => {
      return state.numActiveWorkflows > 0
    },
  },
})

export { useWorkflowsStore }
