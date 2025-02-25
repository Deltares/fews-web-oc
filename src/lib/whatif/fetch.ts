import { configManager } from '@/services/application-config'
import {
  PiWebserviceProvider,
  PostWhatIfScenarioFilter,
  PostWhatIfScenarioResponse,
  RunTaskFilter,
} from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '../requests/transformRequest'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

export interface PostWhatIfScenarioSuccess {
  data: PostWhatIfScenarioResponse
  status: 'success'
}

export interface PostWhatIfScenarioError {
  error: string
  status: 'error'
}

export type PostWhatIfScenarioResult =
  | PostWhatIfScenarioSuccess
  | PostWhatIfScenarioError

export async function postWhatIfScenario(
  filter: PostWhatIfScenarioFilter,
): Promise<PostWhatIfScenarioResult> {
  try {
    const result = await webServiceProvider.postWhatIfScenario(filter, '')
    return {
      data: result,
      status: 'success',
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while posting WhatIf scenario',
      status: 'error',
    }
  }
}

export interface PostRunTaskSuccess {
  data: string
  status: 'success'
}

export interface PostRunTaskError {
  error: string
  status: 'error'
}

export type PostRunTaskResult = PostRunTaskSuccess | PostRunTaskError

export async function postRunTask(
  filter: RunTaskFilter,
): Promise<PostRunTaskResult> {
  try {
    const result = await webServiceProvider.postRunTask(filter, '')
    return {
      data: result,
      status: 'success',
    }
  } catch (error) {
    console.error(error)
    return {
      error: 'Error while posting Run Task',
      status: 'error',
    }
  }
}
