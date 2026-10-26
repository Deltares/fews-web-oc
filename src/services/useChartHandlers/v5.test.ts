import { describe, expect, it } from 'vitest'
import {
  createV5ChartGroup,
  initializeV5ElevationScale,
  initializeV5TimeScale,
  updateBrushSelection,
  updateTimeScaleDomain,
} from './v5'

describe('v5 chart group synchronization', () => {
  it('initializes elevation independently and preserves interactive domains', () => {
    const group = createV5ChartGroup()
    initializeV5ElevationScale(group, {
      kind: 'value',
      domain: [-10, 100],
      defaultDomain: [-20, 120],
      reverse: true,
      nice: false,
    })
    expect(group.elevationScale.domain.get()).toEqual([-10, 100])
    expect(group.elevationScale.options.get().resolved).toMatchObject({
      defaultDomain: [-20, 120],
      reverse: true,
      nice: false,
      includeZero: false,
    })
    group.elevationScale.update({ domain: [20, 40] })
    initializeV5ElevationScale(group, { kind: 'value', domain: [0, 200] })
    expect(group.elevationScale.domain.get()).toEqual([20, 40])
    expect(group.timeScale.domain.get()).toEqual([0, 1])
    expect(group.pointer.by).toBe('x')
    expect(group.elevationPointer.by).toBe('y')
    expect(createV5ChartGroup().elevationScale).not.toBe(group.elevationScale)
  })

  it('shares time domains and brush selections within a chart group', () => {
    const group = createV5ChartGroup()
    const fullDomain: [Date, Date] = [
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-02T00:00:00Z'),
    ]
    const selectedDomain: [Date, Date] = [
      new Date('2025-01-01T06:00:00Z'),
      new Date('2025-01-01T18:00:00Z'),
    ]

    initializeV5TimeScale(group, 'timeScale', fullDomain)
    initializeV5TimeScale(group, 'brushTimeScale', fullDomain)
    updateBrushSelection(group, selectedDomain)

    expect(group.timeScale.domain.get()).toEqual(
      fullDomain.map((date) => date.getTime()),
    )
    expect(group.selection.selection.get()?.ranges).toEqual([
      {
        scale: group.brushTimeScale,
        axis: 'x',
        range: selectedDomain.map((date) => date.getTime()),
      },
    ])

    updateTimeScaleDomain(group.timeScale, selectedDomain)

    expect(group.timeScale.domain.get()).toEqual(
      selectedDomain.map((date) => date.getTime()),
    )
    updateBrushSelection(group, undefined)
    expect(group.selection.selection.get()).toBeUndefined()
  })

  it('keeps an equal brush selection when echoing a truncated domain', () => {
    const group = createV5ChartGroup()
    group.selection.setSelection({
      mode: 'x',
      ranges: [
        { scale: group.brushTimeScale, axis: 'x', range: [1000.4, 2000.7] },
      ],
    })
    const before = group.selection.selection.get()

    updateBrushSelection(group, [new Date(1000), new Date(2000)])

    expect(group.selection.selection.get()).toBe(before)
  })

  it('keeps the first configured full domain as the reset domain', () => {
    const group = createV5ChartGroup()
    const firstDomain: [Date, Date] = [
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-02T00:00:00Z'),
    ]
    const laterDomain: [Date, Date] = [
      new Date('2025-02-01T00:00:00Z'),
      new Date('2025-02-02T00:00:00Z'),
    ]

    initializeV5TimeScale(group, 'timeScale', firstDomain)
    updateTimeScaleDomain(group.timeScale, laterDomain)
    initializeV5TimeScale(group, 'timeScale', firstDomain)

    expect(group.timeScale.domain.get()).toEqual(
      laterDomain.map((date) => date.getTime()),
    )
    expect(group.timeScale.options.get().resolved.defaultDomain).toEqual(
      firstDomain.map((date) => date.getTime()),
    )
  })
})
