import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type ForecasterNotesFilter,
  PiWebserviceProvider,
  ForecasterNoteGroup,
} from '@deltares/fews-pi-requests'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { ref, shallowRef, toValue, watchEffect } from 'vue'

export interface UseNoteGroupReturn {
  error: Ref<string | undefined>
  noteGroup: ShallowRef<ForecasterNoteGroup | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export function useNoteGroup(
  baseUrl: string,
  noteGroupId: MaybeRefOrGetter<string | undefined>,
): UseNoteGroupReturn {
  const noteGroup = shallowRef<ForecasterNoteGroup>()
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string>()

  async function loadNoteGroup() {
    isLoading.value = true
    isReady.value = false

    try {
      const _noteGroupId = toValue(noteGroupId)
      if (_noteGroupId === undefined) {
        noteGroup.value = undefined
        return
      }
      const provider = new PiWebserviceProvider(baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })
      const filter: ForecasterNotesFilter = {
        noteGroupId: _noteGroupId,
      }
      const response = await provider.getForecasterNotes(filter)
      if (!response) throw new Error('NoteGroups response is undefined')

      noteGroup.value = response.noteGroups?.[0]
    } catch {
      error.value = 'Error loading noteGroups'
      noteGroup.value = undefined
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  watchEffect(loadNoteGroup)

  return {
    noteGroup,
    isReady,
    isLoading,
    error,
  }
}
