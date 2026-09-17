import { describe, expect, it } from 'vitest'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  getFilterIdsForNode,
  getReportModuleInstanceIdsForNode,
  nodeHasReports,
  recursiveUpdateNode,
} from './nodes'

describe('getReportModuleInstanceIdsForNode', () => {
  it('normalizes plural and singular filter ids', () => {
    const topologyNode = {
      id: 'viewer_meteorology_rainfall',
      name: 'Rainfall',
      filterIds: ['Rain Gauges'],
      filterId: 'Forecast Rainfall',
    } as unknown as TopologyNode

    expect(getFilterIdsForNode(topologyNode)).toEqual([
      'Rain Gauges',
      'Forecast Rainfall',
    ])
  })

  it('collects report module instance ids from nested topology nodes', () => {
    const topologyNode = {
      id: 'viewer_meteorology_rainfall',
      name: 'Rainfall',
      topologyNodes: [
        {
          id: 'viewer_meteorology_rainfall_forecast',
          name: 'Forecast',
          topologyNodes: [
            {
              id: 'viewer_meteorology_rainfall_forecast_saws_1x1',
              name: 'Regional NWP 1x1',
              reportModuleInstanceId: 'ReportRainfallReturnPeriodTableForecast',
            },
          ],
        },
        {
          id: 'viewer_meteorology_rainfall_observed',
          name: 'Observed',
          topologyNodes: [
            {
              id: 'viewer_meteorology_rainfall_observed_rain_gauges',
              name: 'Rain Gauges',
              reportModuleInstanceId: 'ReportRainfallReturnPeriodTable',
            },
          ],
        },
      ],
    } as unknown as TopologyNode

    expect(getReportModuleInstanceIdsForNode(topologyNode)).toEqual([
      'ReportRainfallReturnPeriodTableForecast',
      'ReportRainfallReturnPeriodTable',
    ])
    expect(nodeHasReports(topologyNode)).toBe(true)
  })

  it('deduplicates direct and report display module instance ids', () => {
    const topologyNode = {
      id: 'viewer_meteorology_rainfall_observed_rain_gauges',
      name: 'Rain Gauges',
      reportModuleInstanceId: 'ReportRainfallReturnPeriodTable',
      reportDisplay: {
        reports: [
          { moduleInstanceId: 'ReportRainfallReturnPeriodTable' },
          { moduleInstanceId: 'ReportHazardMapRainfallSAWS' },
        ],
      },
    } as unknown as TopologyNode

    expect(getReportModuleInstanceIdsForNode(topologyNode)).toEqual([
      'ReportRainfallReturnPeriodTable',
      'ReportHazardMapRainfallSAWS',
    ])
  })

  it('keeps leaf display nodes selectable', () => {
    const topologyNode: TopologyNode = {
      id: 'viewer_meteorology_rainfall_forecast_saws_4x4',
      name: 'Regional NWP 4x4',
      gridDisplaySelection: {
        groupId: 'precipitation',
        plotId: 'saws4',
      },
    }

    const items = recursiveUpdateNode([topologyNode], undefined, false, 'main')

    expect(items[0].to).toEqual({
      name: 'TopologyDisplay',
      params: {
        nodeId: 'viewer_meteorology_rainfall_forecast_saws_4x4',
        topologyId: 'main',
      },
    })
  })

  it('makes branch nodes selectable when they contain reports or have their own filter ids', () => {
    const topologyNodes = [
      {
        id: 'forecast',
        name: 'Forecast',
        topologyNodes: [
          {
            id: 'forecast_saws_4x4',
            name: 'Regional NWP 4x4',
            gridDisplaySelection: {
              groupId: 'precipitation',
              plotId: 'saws4',
            },
          },
        ],
      },
      {
        id: 'comparison',
        name: 'Comparison',
        filterIds: ['Rain Gauges'],
        topologyNodes: [
          {
            id: 'comparison_rain_gauges',
            name: 'Rain Gauges',
            gridDisplaySelection: {
              groupId: 'precipitation',
              plotId: 'rain_gauges',
            },
          },
        ],
      },
      {
        id: 'observed',
        name: 'Observed',
        topologyNodes: [
          {
            id: 'observed_rain_gauges',
            name: 'Rain Gauges',
            reportModuleInstanceId: 'ReportRainfallReturnPeriodTable',
          },
        ],
      },
    ] as unknown as TopologyNode[]

    const items = recursiveUpdateNode(topologyNodes, undefined, false, 'main')

    expect(items[0].to).toBeUndefined()
    expect(items[0].children?.[0].to).toBeDefined()
    expect(items[1].to).toEqual({
      name: 'TopologyDisplay',
      params: {
        nodeId: 'comparison',
        topologyId: 'main',
      },
    })
    expect(items[2].to).toEqual({
      name: 'TopologyDisplay',
      params: {
        nodeId: 'observed',
        topologyId: 'main',
      },
    })
  })
})
