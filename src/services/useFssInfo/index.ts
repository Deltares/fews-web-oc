import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type WorkflowFssInfoClass,
  type FssInfoFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseFssInfoReturn {
  error: Ref<string | undefined>
  fssInfo: ShallowRef<WorkflowFssInfoClass | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useFssInfo(
  baseUrl: string,
  workflowId: MaybeRefOrGetter<string | undefined>,
): UseFssInfoReturn {
  const fssInfo = shallowRef<WorkflowFssInfoClass>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadFssInfo() {
    isLoading.value = true
    isReady.value = false

    try {
      const _workflowId = toValue(workflowId)
      if (_workflowId === undefined) {
        fssInfo.value = undefined
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: FssInfoFilter = {
        workflowId: _workflowId,
      }
      const response = await provider.getFssInfo(filter)
      if (!response) throw new Error('FssInfo response is undefined')

      fssInfo.value = response.workflowFssInfo
    } catch {
      error.value = 'Error loading fssInfo'
      fssInfo.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadFssInfo)

  return {
    fssInfo,
    isReady,
    isLoading,
    error,
  }
}
