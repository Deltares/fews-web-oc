import { afterEach, describe, expect, test, vi } from 'vitest'
import type { CartesianAxes } from '@deltares/fews-web-oc-charts'
import { getAxisOptions, getAxisTimeZone, setAxisTimeZone } from './axisOptions'
import { defaultChartSettings } from '@/lib/topology/componentSettings/chartSettings'
import { setDisplayTimeZone, SYSTEM_TIME_ZONE } from '@/lib/date/timeZone'
import type { ChartConfig } from './types/ChartConfig'

afterEach(() => {
  setDisplayTimeZone(SYSTEM_TIME_ZONE)
})

const config = {} as ChartConfig
const settings = defaultChartSettings.timeSeriesChart

describe('getAxisTimeZone', () => {
  test('is the browser time zone for the system setting', () => {
    expect(getAxisTimeZone()).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )
  })

  test('is the display time zone', () => {
    setDisplayTimeZone('Asia/Tokyo')
    expect(getAxisTimeZone()).toBe('Asia/Tokyo')
  })
})

describe('getAxisOptions', () => {
  test('sets the time zone of the time axis', () => {
    const options = getAxisOptions(config, settings, { timeZone: 'UTC' })
    expect(options.x[0].timeZone).toBe('UTC')
  })

  test('does not set a time zone for vertical profiles', () => {
    const options = getAxisOptions(config, settings, {
      timeZone: 'UTC',
      isVerticalProfile: true,
    })
    expect(options.x[0].timeZone).toBeUndefined()
  })
})

describe('setAxisTimeZone', () => {
  test('updates the options of the axes and x-axis handles and redraws', () => {
    const axis = {
      options: { x: [{ timeZone: 'UTC' }], y: [{}] },
      axisHandles: {
        x0: { options: { timeZone: 'UTC' } },
        y0: { options: {} },
      },
      redraw: vi.fn(),
    }

    setAxisTimeZone(axis as unknown as CartesianAxes, 'Asia/Tokyo')

    expect(axis.options.x[0].timeZone).toBe('Asia/Tokyo')
    expect(axis.axisHandles.x0.options.timeZone).toBe('Asia/Tokyo')
    expect(axis.axisHandles.y0.options).toEqual({})
    expect(axis.redraw).toHaveBeenCalledOnce()
  })
})
