import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, shallowRef } from 'vue'
import type { CorrelationResponse } from '@deltares/fews-pi-requests'
import { useCorrelation } from '@/services/useCorrelation'
import { useCorrelationChartData } from '@/services/useCorrelationChartData'
import { CORRELATION_POINTS_ID } from '@/lib/analysis/correlation'

vi.mock('@/services/useCorrelation', () => ({
  useCorrelation: vi.fn(),
}))

const correlation = shallowRef<CorrelationResponse>()

describe('useCorrelationChartData', () => {
  beforeEach(() => {
    correlation.value = undefined
    vi.mocked(useCorrelation).mockReturnValue({
      correlation,
      isLoading: ref(false),
      error: ref(undefined),
    })
  })

  it('keeps scatter points when no regression fit is available', () => {
    correlation.value = {
      values: [{ time: '2026-01-01T00:00:00Z', x: 1, y: 2 }],
    }

    const chartData = useCorrelationChartData({})

    expect(chartData.hasScatterPoints.value).toBe(true)
    expect(chartData.hasRegressionFit.value).toBe(false)
    expect(chartData.series.value[CORRELATION_POINTS_ID].data).toHaveLength(1)
  })

  it('reports no scatterplot when the response contains no values', () => {
    correlation.value = { values: [] }

    const chartData = useCorrelationChartData({})

    expect(chartData.hasScatterPoints.value).toBe(false)
    expect(chartData.hasRegressionFit.value).toBe(false)
  })

  it('exposes the equation status description when status is not nominal', () => {
    correlation.value = {
      equation: {
        description: 'y = x',
        type: 'simple linear',
        coefficientA: 0,
        coefficientB: 1,
        rSquared: 1,
        status: 'input-too-short',
        statusDescription: 'Not enough points',
        requiredPointCount: 2,
      },
    }

    const chartData = useCorrelationChartData({})

    expect(chartData.statusDescription.value).toBe('Not enough points')
  })

  it('does not expose a status description for nominal equations', () => {
    correlation.value = {
      equation: {
        description: 'y = x',
        type: 'simple linear',
        coefficientA: 0,
        coefficientB: 1,
        rSquared: 1,
        status: 'nominal',
        statusDescription: '',
        requiredPointCount: 2,
      },
    }

    const chartData = useCorrelationChartData({})

    expect(chartData.statusDescription.value).toBeUndefined()
  })
})
