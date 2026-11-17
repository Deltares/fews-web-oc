import { effectScope, type EffectScope } from 'vue'
import { afterEach, expect, test } from 'vitest'
import { sharedRequest } from '@deltares/fews-web-oc-composables'
import {
  clearEndedSharedRequestHistory,
  sharedRequestHistory,
  useSharedRequestHistoryTracker,
} from './useSharedRequestHistory'

const scopes: EffectScope[] = []
let uniqueKey = 0

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
  clearEndedSharedRequestHistory()
})

function startTracker(): void {
  const scope = effectScope()
  scope.run(useSharedRequestHistoryTracker)
  scopes.push(scope)
}

function createKey(): string {
  uniqueKey += 1
  return `https://example.test/shared-request-history/${uniqueKey}`
}

test('records subscriber changes and request completion', async () => {
  clearEndedSharedRequestHistory()
  startTracker()

  let resolveRequest!: (value: string) => void
  const pendingRequest = new Promise<string>((resolve) => {
    resolveRequest = resolve
  })
  const key = createKey()
  const firstCaller = sharedRequest(key, () => pendingRequest)
  const secondCaller = sharedRequest(key, () => Promise.resolve('unused'))

  expect(sharedRequestHistory.value[0]).toMatchObject({
    key,
    subscriberCount: 2,
    peakSubscriberCount: 2,
    state: 'in-flight',
  })

  resolveRequest('complete')
  await Promise.all([firstCaller, secondCaller])

  expect(sharedRequestHistory.value[0]).toMatchObject({
    key,
    subscriberCount: 0,
    state: 'ended',
    peakSubscriberCount: 2,
  })
  expect(sharedRequestHistory.value[0].endedAt).toBeTypeOf('number')
})

test('keeps only the latest 100 requests', async () => {
  clearEndedSharedRequestHistory()
  startTracker()

  const keys = Array.from({ length: 101 }, createKey)
  for (const key of keys) {
    await sharedRequest(key, async () => key)
  }

  expect(sharedRequestHistory.value).toHaveLength(100)
  expect(
    sharedRequestHistory.value.some((entry) => entry.key === keys[0]),
  ).toBe(false)
  expect(sharedRequestHistory.value[0].key).toBe(keys[100])
})
