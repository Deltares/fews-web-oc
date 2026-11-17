import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useDynamicReport } from '@/services/useDynamicReport'

const getCapabilities = vi.hoisted(() => vi.fn())
const getReport = vi.hoisted(() => vi.fn())

vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => undefined,
}))

vi.mock('@deltares/fews-pi-requests', () => ({
  PiWebserviceProvider: class {
    getDynamicReportDisplayCapabilities = getCapabilities
    getDynamicReportDisplay = getReport
  },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve))
  await nextTick()
}

async function setup(initialLocationId?: string) {
  const filter = ref<{ locationId?: string }>({
    locationId: initialLocationId,
  })
  const report = useDynamicReport('http://test/', 'display', filter)
  await flush()
  return { filter, ...report }
}

describe('useDynamicReport', () => {
  beforeEach(() => {
    getReport.mockReset()
    getCapabilities.mockReset()
    getCapabilities.mockResolvedValue({
      dynamicReportDisplayCapabilities: {
        selectableLocations: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
        ],
      },
    })
  })

  it('is ready without a report or error after an empty response', async () => {
    getReport.mockResolvedValue('')

    const { reportHtml, isReady, isLoading, error } = await setup('a')

    expect(reportHtml.value).toBe('')
    expect(isReady.value).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('exposes an error when the request fails', async () => {
    getReport.mockRejectedValue(new Error('Server error'))

    const { reportHtml, isLoading, error } = await setup('a')

    expect(reportHtml.value).toBe('')
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeDefined()
  })

  it('clears a previous error when a new request starts', async () => {
    getReport.mockRejectedValueOnce(new Error('Server error'))
    const { filter, error } = await setup('a')
    expect(error.value).toBeDefined()

    getReport.mockResolvedValueOnce('')
    filter.value = { locationId: 'b' }
    await flush()

    expect(error.value).toBeUndefined()
  })

  it('stays loading when a superseded request returns an empty report', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    getReport
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { filter, reportHtml, isReady, isLoading } = await setup('a')
    filter.value = { locationId: 'b' }
    await flush()

    first.resolve('')
    await flush()

    expect(isReady.value).toBe(false)
    expect(isLoading.value).toBe(true)

    second.resolve('<p>b</p>')
    await flush()

    expect(reportHtml.value).toBe('<p>b</p>')
    expect(isReady.value).toBe(true)
    expect(isLoading.value).toBe(false)
  })

  it('ignores a superseded response that arrives last', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    getReport
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { filter, reportHtml } = await setup('a')
    filter.value = { locationId: 'b' }
    await flush()

    second.resolve('<p>b</p>')
    await flush()
    first.resolve('<p>a</p>')
    await flush()

    expect(reportHtml.value).toBe('<p>b</p>')
  })

  it('ignores the failure of a superseded request', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    getReport
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { filter, reportHtml, error } = await setup('a')
    filter.value = { locationId: 'b' }
    await flush()

    second.resolve('<p>b</p>')
    await flush()
    first.reject(new Error('Server error'))
    await flush()

    expect(reportHtml.value).toBe('<p>b</p>')
    expect(error.value).toBeUndefined()
  })

  it('stops loading when the filter no longer allows a request', async () => {
    const first = deferred<string>()
    getReport.mockReturnValueOnce(first.promise)

    const { filter, reportHtml, isReady, isLoading } = await setup('a')
    filter.value = { locationId: 'unknown' }
    await flush()

    expect(isLoading.value).toBe(false)

    first.resolve('')
    await flush()

    expect(isReady.value).toBe(false)
    expect(reportHtml.value).toBe('')
  })

  it('clears the previous report when the filter no longer allows a request', async () => {
    getReport.mockResolvedValueOnce('<p>a</p>')

    const { filter, reportHtml } = await setup('a')
    await flush()
    expect(reportHtml.value).toBe('<p>a</p>')

    filter.value = { locationId: 'unknown' }
    await flush()

    expect(reportHtml.value).toBe('')
  })

  it('ignores an in-flight report when the filter no longer allows a request', async () => {
    const first = deferred<string>()
    getReport.mockReturnValueOnce(first.promise)

    const { filter, reportHtml } = await setup('a')
    filter.value = { locationId: 'unknown' }
    await flush()

    first.resolve('<p>a</p>')
    await flush()

    expect(reportHtml.value).toBe('')
  })
})
