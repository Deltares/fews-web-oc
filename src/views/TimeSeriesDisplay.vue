<template>
  <div>
    <portal to="web-oc-sidebar">
      <v-toolbar dense flat>
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          dense
          group
          mandatory
        >
        <v-btn text><v-icon>mdi-file-tree</v-icon></v-btn>
        <v-btn text><v-icon>mdi-view-week</v-icon></v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <v-divider />
      <TreeMenu
        v-if="viewMode === 0"
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </TreeMenu>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </ColumnMenu>
    </portal>
    <div v-for="(display, index) in displays" :key="index">
      <time-series-component :value="display" :series="timeSeriesStore"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Vue, Watch } from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import { ColumnItem } from '@/components/ColumnItem'
import TimeSeriesComponent from '@/components/TimeSeriesComponent/index.vue'
import SeriesStore from '@/mixins/SeriesStore'
import { Series, SeriesUrlRequest } from '@/lib/TimeSeries'
import { ChartConfig, ChartSeries } from '@/components/TimeSeriesComponent/lib/ChartConfig'
import { cloneDeep } from 'lodash'


function convertTimeSeriesDisplayToWbCharts(r: any): ChartConfig {
  const subplot = r.subplots[0]
  const config: ChartConfig = {
    title: r.title,
    xAxis: [],
    yAxis: [{
      type: 'value',
      location: subplot.items[0].yAxis.axisPosition,
      label: subplot.items[0].yAxis.axisLabel,
    }],
  }
  const series: ChartSeries[] = []
  const requestIds: string[] = []
  for (const index in subplot.items) {
    const item = subplot.items[index]
    requestIds.push(item.request)
    const count = requestIds.filter((i) => i === item.request).length
    const s = {
      id: `${item.request}[${count - 1}]`,
      dataResources: [
        `${item.request}[${count - 1}]`
      ],
      name: item.legend,
      unit: item.unit,
      type: 'line',
      options: {
        x: {
          key: "x",
          axisIndex: 0
        },
        y: {
          key: "y",
          axisIndex: 0
        },
      },
      style: {
        stroke: item.color,
        fill: "none",
        'stroke-width': item.lineWidth + 'px'
      }
    }
    series.push(s)
    if (item.markerStyle !== undefined) {
      const s2 = cloneDeep(s)
      s2.type = 'marker'
      s2.style = {
        stroke: item.color,
        fill: "none",
        'stroke-width': item.lineWidth + 'px'
      }
      series.push(s2)
    }
  }
  config.series = series
  return config
}

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    TimeSeriesComponent
  }
})
export default class TimeSeriesDisplay extends Mixins(SeriesStore) {
  @Prop({ default: '', type: String })
  nodeId!: string

  drawer = true
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  baseUrl!: string
  displays = []
  requests: Record<string, URL> = {}

  created (): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted (): Promise<void> {
    await this.loadNodes()
    this.onNodeChange()
  }

  async loadNodes (): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rest/fewspiservice/v1/topology/nodes`)
    const nodes = await response.json()

    const recursiveUpdateNode: any = (nodes: any[]) => {
      const resultNodes: any = nodes.map((node) => {
        const result: ColumnItem = {
          id: node.id,
          name: node.name,
          icon: node.workflowId ? 'mdi-restart' : undefined
        }
        if (node.topologyNodes) {
          result.children = recursiveUpdateNode(node.topologyNodes)
        } else {
          result.to = {
            name: 'TimeSeriesDisplay',
            params: {
              nodeId: node.id
            }
          }
        }
        return result
      })
      return resultNodes
    }
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Topologie',
        children: recursiveUpdateNode(nodes.topologyNodes)
      }
    ]

    this.items = items
    this.open = [items[0].id]
  }

  @Watch('nodeId')
  async onNodeChange (): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rest/fewspiservice/v1/displaygroups?&nodeId=${this.nodeId}`)
    const json = await response.json()
    this.displays = json.results.map((result: any) => {
      if (result.config !== undefined) {
        return convertTimeSeriesDisplayToWbCharts(result.config.timeSeriesDisplay)
      } else {
        return
      }
    })
    for (const result of json.results) {
      for (const r of result.requests) {
        const url = new URL(`${this.baseUrl}/${r.request}`)
        const piResponse = await fetch(url.toString())
        const piSeries = await piResponse.json()
        for (const index in piSeries.timeSeries) {
          const t = piSeries.timeSeries[index]
          const resourceId = `${r.key}[${index}]`
          const resource = new SeriesUrlRequest('fews-pi', url.toString())
          const series = new Series(resource)
          series.header.name = `${t.header.stationName} - ${t.header.parameterId} (${t.header.moduleInstanceId})`
          series.header.unit = t.header.units
          series.header.parameter = t.header.parameterId
          series.header.location = t.header.stationName
          series.header.source = t.header.moduleInstanceId
          series.start = new Date(`${t.header.startDate.date}T${t.header.startDate.time}`)
          series.end = new Date(`${t.header.endDate.date}T${t.header.endDate.time}`)
          series.data = t.events.map((event: any) => {
            return {
              x: new Date(`${event.date}T${event.time}`),
              y: event.flag === '8' ? null : +event.value}
          })
          Vue.set(this.timeSeriesStore, resourceId, series)
        }
      }
    }
  }

  @Watch('active')
  onActiveChange (): void {
    console.log('update:active', this.active)
  }

  @Watch('open')
  onOpenChange (): void {
    console.log('update:open', this.open)
  }

  toggleDrawer (): void {
    this.drawer = !this.drawer
  }

  get drawerIcon (): string {
    return this.drawer ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right'
  }
}
</script>
