import { readonly, shallowRef, watch } from 'vue'
import {
  useSharedRequestRegistrations,
  type SharedRequestRegistration,
} from '@deltares/fews-web-oc-composables'

export interface SharedRequestHistoryEntry {
  id: number
  key: string
  startedAt: number
  subscriberCount: number
  peakSubscriberCount: number
  state: 'in-flight' | 'ended'
  endedAt?: number
}

const MAX_HISTORY_ENTRIES = 100
const history = shallowRef<SharedRequestHistoryEntry[]>([])
const activeRequestIds = new Map<string, number>()
let nextRequestId = 0

export const sharedRequestHistory = readonly(history)

export function clearEndedSharedRequestHistory(): void {
  history.value = history.value.filter((entry) => entry.state === 'in-flight')
}

export function useSharedRequestHistoryTracker(): void {
  const registrations = useSharedRequestRegistrations()

  watch(registrations, updateHistory, {
    immediate: true,
    flush: 'sync',
  })
}

function updateHistory(registrations: readonly SharedRequestRegistration[]) {
  const currentKeys = new Set(registrations.map(({ key }) => key))

  registrations.forEach((registration) => {
    const existingId = activeRequestIds.get(registration.key)
    if (existingId !== undefined) {
      updateEntry(existingId, {
        subscriberCount: registration.subscriberCount,
        peakSubscriberCount: Math.max(
          getEntry(existingId)?.peakSubscriberCount ?? 0,
          registration.subscriberCount,
        ),
      })
      return
    }

    const id = nextRequestId++
    activeRequestIds.set(registration.key, id)
    history.value = [
      {
        id,
        key: registration.key,
        startedAt: registration.startedAt,
        subscriberCount: registration.subscriberCount,
        peakSubscriberCount: registration.subscriberCount,
        state: 'in-flight' as const,
      },
      ...history.value,
    ].slice(0, MAX_HISTORY_ENTRIES)
  })

  activeRequestIds.forEach((id, key) => {
    if (currentKeys.has(key)) return

    activeRequestIds.delete(key)
    updateEntry(id, {
      state: 'ended',
      endedAt: Date.now(),
      subscriberCount: 0,
    })
  })
}

function getEntry(id: number): SharedRequestHistoryEntry | undefined {
  return history.value.find((entry) => entry.id === id)
}

function updateEntry(
  id: number,
  update: Partial<SharedRequestHistoryEntry>,
): void {
  history.value = history.value.map((entry) =>
    entry.id === id ? { ...entry, ...update } : entry,
  )
}
