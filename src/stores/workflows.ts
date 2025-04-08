import {
  PiWebserviceProvider,
  ProcessDataFilter,
  RunTaskFilter,
} from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'

import { downloadFileWithXhr } from '@/lib/download'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'
import type { BoundingBox } from '@/services/useBoundingBox'
import type { LngLat } from 'maplibre-gl'
import { toISOString } from '@/lib/date'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'

interface WorkflowsState {
  showDialog: boolean
  workflowId: string | null
  startTime: string | null
  endTime: string | null
  numActiveWorkflows: number
  boundingBox: BoundingBox | null
  isDrawingBoundingBox: boolean
  coordinate: LngLat | null
  isSelectingCoordinate: boolean
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

function isPartialProcessDataFilter(
  config: PartialRunTaskFilter | PartialProcessDataFilter,
): config is PartialProcessDataFilter {
  return (config as PartialProcessDataFilter).xCellSize !== undefined
}

const useWorkflowsStore = defineStore('workflows', {
  state: (): WorkflowsState => ({
    showDialog: false,
    workflowId: null,
    startTime: null,
    endTime: null,
    numActiveWorkflows: 0,
    boundingBox: null,
    isDrawingBoundingBox: false,
    isSelectingCoordinate: false,
    coordinate: null,
  }),

  actions: {
    async startWorkflow(
      type: WorkflowType,
      filter: PartialRunTaskFilter | PartialProcessDataFilter,
      options?: StartWorkflowOptions,
    ) {
      if (this.workflowId === null) {
        throw new Error('Workflow ID has not been set.')
      }
      if (
        type === WorkflowType.ProcessData &&
        isPartialProcessDataFilter(filter)
      ) {
        if (this.startTime === null || this.endTime === null) {
          throw new Error('Start time or end time has not been set.')
        }
        const completeFilter: ProcessDataFilter = {
          ...filter,
          workflowId: this.workflowId,
          startTime: this.startTime,
          endTime: this.endTime,
        }
        const url = webServiceProvider.processDataUrl(completeFilter)
        const now = toISOString(new Date())
          .replaceAll('-', '')
          .replaceAll(':', '')
        const fileName = `${now}${options?.fileName ?? '_DATA'}`
        try {
          this.numActiveWorkflows++
          await downloadFileWithXhr(
            url.toString(),
            fileName,
            authenticationManager.getAccessToken(),
          )
        } finally {
          this.numActiveWorkflows--
        }
      } else if (type === WorkflowType.RunTask) {
        const completeFilter: RunTaskFilter = {
          ...filter,
          workflowId: this.workflowId,
        }
        try {
          this.numActiveWorkflows++
          await webServiceProvider.postRunTask(
            completeFilter,
            options?.body ?? '',
          )
        } finally {
          this.numActiveWorkflows--
        }
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
