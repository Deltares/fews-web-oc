// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import {
  createV5ChartGroup,
  initializeV5TimeScale,
  watchTimeScaleReset,
} from './v5'

describe('shared time scale reset', () => {
  it('detects an explicit domain being cleared even when the visible domain stays the same', async () => {
    const group = createV5ChartGroup()
    const scale = group.timeScale
    initializeV5TimeScale(group, 'timeScale', [0, 10000])
    const onReset = vi.fn()
    const stop = watchTimeScaleReset(scale, onReset)

    scale.update({ domain: [0, 10000] })
    await new Promise(requestAnimationFrame)
    expect(onReset).not.toHaveBeenCalled()
    scale.update({ locale: 'en-GB' })
    await new Promise(requestAnimationFrame)
    expect(onReset).not.toHaveBeenCalled()
    scale.update({ domain: undefined })
    await vi.waitFor(() => expect(onReset).toHaveBeenCalledTimes(1))
    expect(scale.domain.get()).toEqual([0, 10000])

    scale.update({ domain: [2000, 8000] })
    await new Promise(requestAnimationFrame)
    scale.update({ domain: undefined })
    await vi.waitFor(() => expect(onReset).toHaveBeenCalledTimes(2))

    stop()
    scale.update({ domain: [2000, 8000] })
    await new Promise(requestAnimationFrame)
    scale.update({ domain: undefined })
    await new Promise(requestAnimationFrame)
    expect(onReset).toHaveBeenCalledTimes(2)
  })
})
