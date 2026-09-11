import { describe, expect, it } from 'vitest'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  getReportModuleInstanceIdsForNode,
  nodeHasReports,
  recursiveUpdateNode,
} from './nodes'

describe('getReportModuleInstanceIdsForNode', () => {
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

  it('only makes branch nodes selectable when they contain reports', () => {
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
        nodeId: 'observed',
        topologyId: 'main',
      },
    })
  })
})
