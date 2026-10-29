import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSystemTimeStore } from '@/stores/systemTime'

let backendTime = new Date('2026-10-29T12:00:00Z')

vi.mock('@/services/system-time', () => ({
  systemTimeAuthority: {
    syncFromBackend: async () => ({
      systemTime: backendTime,
      fetchedAtClientMs: Date.now(),
    }),
    now: () => backendTime,
    hasAnchor: () => true,
  },
}))

async function flush() {
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()
}

describe('useSystemTimeStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    backendTime = new Date('2026-10-29T12:00:00Z')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves a preset period with the system time on each sync', async () => {
    const store = useSystemTimeStore()
    await flush()

    store.selectedInterval = { start: { days: -1 }, end: { hours: 6 } }
    await flush()

    expect(store.isRunningWindow).toBe(true)
    expect(store.startTime).toEqual(new Date('2026-10-28T12:00:00Z'))
    expect(store.endTime).toEqual(new Date('2026-10-29T18:00:00Z'))

    backendTime = new Date('2026-10-29T12:01:00Z')
    await vi.advanceTimersByTimeAsync(60_000)
    await nextTick()

    expect(store.startTime).toEqual(new Date('2026-10-28T12:01:00Z'))
    expect(store.endTime).toEqual(new Date('2026-10-29T18:01:00Z'))
  })

  it('keeps a custom period on a sync', async () => {
    const store = useSystemTimeStore()
    await flush()

    const startTime = new Date('2026-10-01T00:00:00Z')
    store.selectedInterval = 'custom'
    store.startTime = startTime
    await flush()

    backendTime = new Date('2026-10-29T12:01:00Z')
    await vi.advanceTimersByTimeAsync(60_000)
    await nextTick()

    expect(store.isRunningWindow).toBe(false)
    expect(store.startTime).toEqual(startTime)
  })
})
