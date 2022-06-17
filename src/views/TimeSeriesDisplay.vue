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
      {{ display.config.timeSeriesDisplay.title }}
      <time-series-component :value="display.config.timeSeriesDisplay"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import { ColumnItem } from '@/components/ColumnItem'
import TimeSeriesComponent from '@/components/TimeSeriesComponent/index.vue'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    TimeSeriesComponent
  }
})
export default class TimeseriesView extends Vue {
  @Prop({ default: '', type: String })
  nodeId!: string

  drawer = true
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  baseUrl!: string
  displays = []

  created (): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted (): Promise<void> {
    console.log('mounted', this)
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
    this.displays = json.results
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
