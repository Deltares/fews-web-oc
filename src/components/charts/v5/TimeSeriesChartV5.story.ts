import { defineComponent, h } from 'vue'
import TimeSeriesChartV5 from './TimeSeriesChartV5.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { getDefaultSettings } from '@/lib/topology/componentSettings'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'
import { createChartHandlersGroup } from '@/services/useChartHandlers'

export const SharedElevation = defineComponent({
  props: {
    dataReady: { type: Boolean, default: true },
    reversingProfile: { type: Boolean, default: false },
  },
  setup(props) {
    const group = createChartHandlersGroup()
    const settings = getDefaultSettings().charts.verticalProfileChart
    const profiles = [0, 10].map((offset) => {
      const resource = new Series(new SeriesUrlRequest('story', '/profile'))
      resource.data = [
        { x: 1 + offset, y: 0, flag: '0' },
        { x: 2 + offset, y: 50, flag: '0' },
        { x: 3 + offset, y: 100, flag: '0' },
      ]
      const config: ChartConfig = {
        id: `profile-${offset}`,
        title: '',
        xAxis: [{ kind: 'value', domain: [offset, offset + 4] }],
        yAxis: [{ kind: 'value', domain: [0, 100], nice: false, unit: 'm' }],
        series: [
          {
            id: `profile-${offset}`,
            name: 'Profile',
            type: 'line',
            dataResources: [`profile-${offset}`],
            options: {
              x: { key: 'x', axisIndex: 0 },
              y: { key: 'y', axisIndex: 0 },
            },
            unit: 'degC',
            style: { stroke: 'black' },
            visibleInLegend: true,
            visibleInPlot: true,
            visibleInTable: false,
          },
        ],
      }
      return { config, series: { profile: resource } }
    })
    return () => {
      const series = Object.fromEntries(
        profiles.flatMap((profile, index) => {
          if (!props.dataReady) return []
          const resource = new Series(new SeriesUrlRequest('story', '/profile'))
          resource.data =
            props.reversingProfile && index === 0
              ? [
                  { x: 3, y: 0, flag: '0' },
                  { x: 2, y: 25, flag: '0' },
                  { x: 1, y: 50, flag: '0' },
                  { x: 2, y: 100, flag: '0' },
                ]
              : profile.series.profile.data
          return [[`profile-${index * 10}`, resource]]
        }),
      )
      return h(
        'div',
        { style: { display: 'flex', height: '500px', width: '1000px' } },
        profiles.map((profile) =>
          h(TimeSeriesChartV5, {
            config: profile.config,
            series,
            group,
            settings,
            verticalProfile: true,
          }),
        ),
      )
    }
  },
})
