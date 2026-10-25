import { describe, expect, it } from 'vitest'
import {
  createV5ChartGroup,
  initializeV5TimeScale,
  updateBrushSelection,
  updateTimeScaleDomain,
} from './v5'

describe('v5 chart group synchronization', () => {
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
