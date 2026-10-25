// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { LegendEntry } from '@deltares/fews-web-oc-charts'
import { getV5LegendTags } from './legend'

describe('getV5LegendTags', () => {
  it('maps visibility, legend swatches, and forecast tooltips', () => {
    const entries: LegendEntry[] = [
      {
        id: 'observed',
        markId: '0:observed:0',
        label: 'Flow [1]',
        symbol: {
          type: 'line',
          stroke: '#123456',
          strokeWidth: 2,
        },
        visibility: 'hidden',
        disabled: false,
        children: [],
      },
    ]

    expect(
      getV5LegendTags(entries, 'Forecast [1]: observed source')[0],
    ).toMatchObject({
      id: 'observed',
      name: 'Flow [1]',
      disabled: true,
      tooltip: 'Forecast [1]: observed source',
      interactive: true,
    })
    expect(getV5LegendTags(entries)[0].legendSvg).toContain('<svg')
  })

  it('uses a child mark swatch for grouped legend entries', () => {
    const entries: LegendEntry[] = [
      {
        id: 'observations',
        markId: '0:observed:0',
        label: 'Observed',
        symbol: { type: 'group' },
        visibility: 'mixed',
        disabled: false,
        children: [
          {
            id: 'observed',
            markId: '0:observed:0',
            label: 'Observed',
            symbol: {
              type: 'line',
              stroke: '#123456',
              strokeWidth: 2,
            },
            visibility: 'visible',
            disabled: false,
            children: [],
          },
        ],
      },
    ]

    const [tag] = getV5LegendTags(entries)

    expect(tag.name).toBe('Observed')
    expect(tag.disabled).toBe(false)
    expect(tag.legendSvg).toContain('#123456')
  })
})
