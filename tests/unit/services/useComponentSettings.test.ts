import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useComponentSettings } from '@/services/useComponentSettings'

const { getComponentSettings } = vi.hoisted(() => ({
  getComponentSettings: vi.fn(),
}))

vi.mock('@deltares/fews-pi-requests', () => ({
  PiWebserviceProvider: class {
    getComponentSettings = getComponentSettings
  },
}))

vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => undefined,
}))

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve))
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useComponentSettings', () => {
  beforeEach(() => {
    getComponentSettings.mockReset()
  })

  it('is ready when there are no settings to load', async () => {
    const { componentSettings, isReady, isLoading } = useComponentSettings(
      'http://example.com',
      () => [undefined],
    )
    await flushPromises()

    expect(isReady.value).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(componentSettings.value).toBeUndefined()
  })

  it('ignores the result of a request that has been superseded', async () => {
    const slow = deferred<unknown>()
    const fast = deferred<unknown>()
    getComponentSettings.mockImplementation(({ componentSettingsId }) =>
      componentSettingsId === 'stale-slow' ? slow.promise : fast.promise,
    )

    const id = ref('stale-slow')
    const { componentSettings, isReady } = useComponentSettings(
      'http://example.com',
      () => [id.value],
    )

    id.value = 'stale-fast'
    await nextTick()

    slow.resolve({
      webOCComponentSettings: { sidePanel: { showComponent: 'share' } },
    })
    await flushPromises()
    expect(isReady.value).toBe(false)

    fast.resolve({
      webOCComponentSettings: { sidePanel: { showComponent: 'runTask' } },
    })
    await flushPromises()

    expect(isReady.value).toBe(true)
    expect(componentSettings.value?.sidePanel?.showComponent).toBe('runTask')
  })
})
