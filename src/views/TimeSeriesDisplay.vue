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
    <v-main style="overflow-y: auto; height: 100%">
      <div>
        Hoi :) - {{ workflowId }}
        <time-series-component />
      </div>
    </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import { ColumnItem } from '@/components/ColumnItem'
import TimeSeriesComponent from '@/components/TimeSeriesComponent/index.vue'
import _ from 'lodash'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    TimeSeriesComponent
  }
})
export default class timeseriesView extends Vue {
  @Prop({ default: '', type: String })
  workflowId!: string

  drawer = true
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0

  mounted (): void {
    console.log('mounted', this)
    this.loadNodes()
  }

  async loadNodes (): Promise<void> {
    const response = await fetch('https://rwsos-dataservices-ont.avi.deltares.nl/iwp/test/FewsWebServices/rest/fewspiservice/v1/topology/nodes')
    const nodes = await response.json()

    const recursiveUpdateNode: any = (nodes = {}) => {
      const resultNodes: any = Object.entries(nodes).map(node => {
        const result: any = {
          id: node[0],
          name: _.get(node[1], 'name'),
          children: recursiveUpdateNode(_.get(node[1], 'topologyNodes'))
        }
        if (_.get(node[1], 'workflowId')) {
          result.to = {
            name: 'TimeSeriesDisplay',
            params: {
              workflowId: _.get(node[1], 'workflowId')
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
