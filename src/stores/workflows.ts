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
  startTime: string | null
  endTime: string | null
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

type OmitForWorkflow<T> = Omit<T, 'startTime' | 'endTime'>
export type PartialProcessDataFilter = OmitForWorkflow<ProcessDataFilter>
export type RunTaskRequestFilter = Omit<RunTaskFilter, 'userId'> & {
  userId?: string
}

export interface StartWorkflowOptions {
  body?: string
  fileName?: string
}

function isPartialProcessDataFilter(
  config: RunTaskRequestFilter | PartialProcessDataFilter,
): config is PartialProcessDataFilter {
  return (config as PartialProcessDataFilter).xCellSize !== undefined
}

async function completeRunTaskFilter(
  filter: RunTaskRequestFilter,
): Promise<RunTaskFilter> {
  return {
    ...filter,
    userId: filter.userId ?? (await authenticationManager.getCurrentUserId()),
  }
}

export const useWorkflowsStore = defineStore('workflows', {
  state: (): WorkflowsState => ({
    startTime: null,
    endTime: null,
    boundingBox: null,
    isDrawingBoundingBox: false,
    isSelectingCoordinate: false,
    coordinate: null,
  }),

  actions: {
    async startWorkflow(
      type: WorkflowType,
      filter: RunTaskRequestFilter | PartialProcessDataFilter,
      options?: StartWorkflowOptions,
    ) {
      if (
        type === WorkflowType.ProcessData &&
        isPartialProcessDataFilter(filter)
      ) {
        if (this.startTime === null || this.endTime === null) {
          throw new Error('Start time or end time has not been set.')
        }
        const completeFilter: ProcessDataFilter = {
          ...filter,
          startTime: this.startTime,
          endTime: this.endTime,
        }
        const url = webServiceProvider.processDataUrl(completeFilter)
        const now = toISOString(new Date())
          .replaceAll('-', '')
          .replaceAll(':', '')
        const fileName = `${now}${options?.fileName ?? '_DATA'}`
        const headers = await authenticationManager.getAuthorizationHeaders()

        await downloadFileWithXhr(url.toString(), fileName, headers)
      } else if (type === WorkflowType.RunTask) {
        const completeFilter = await completeRunTaskFilter(filter)
        return await webServiceProvider.postRunTask(
          completeFilter,
          options?.body ?? '',
        )
      }
    },
  },
})
