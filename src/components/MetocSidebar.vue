<template>
  <div>
    <TreeMenu
      ref="tree"
      :active.sync="activeNodes"
      :items="nodes"
      :open.sync="openNodes"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'

import type { Category } from '@/lib/Topology'
import type { ColumnItem } from '@/components/ColumnItem';
import TreeMenu from '@/components/TreeMenu.vue';
import PiRequestsMixin from '@/mixins/PiRequestsMixin';

@Component({
  components: {
    TreeMenu
  }
})
export default class MetocSidebar extends Mixins(PiRequestsMixin) {
  @Prop({ default: () => [] }) categories!: Category[]

  nodes: ColumnItem[] = []
  activeNodes: string[] = []
  openNodes: string[] = []

  mounted() {
    this.fillNodes()
  }

  @Watch('categories')
  fillNodes(): void {
    this.nodes = this.categories.map(category => {
      const dataLayerItems = category.dataLayers.map(dataLayer => {
        return {
          id: dataLayer.id,
          name: dataLayer.name,
          to: {
            name: 'MetocDataViewer',
            params: {
              categoryId: category.id,
              dataLayerId: dataLayer.id,
              dataSourceId: dataLayer.dataSources[0].id
            }
          }
        }
      })
      return {
        id: category.id,
        name: category.name,
        children: dataLayerItems
      }
    })
    this.openNodes = [this.$route.params.categoryId]
    this.activeNodes = [this.$route.params.dataLayerId]
  }

  @Watch('$route.params')
  updateNodes(): void {
    this.nodes.forEach(node => {
      node.children?.forEach(nodeChild => {
        const locationId = this.$route.params.locationId
        const hasLocation = locationId !== ''

        const xCoord = this.$route.params.xCoord
        const yCoord = this.$route.params.yCoord
        const hasCoord = xCoord !== ''

        if (hasLocation) {
          nodeChild.to!.name = 'MetocDataViewerWithLocation'
          nodeChild.to!.params!.locationId = locationId
        } else if (hasCoord) {
          nodeChild.to!.name = 'MetocDataViewerWithCoordinates'
          nodeChild.to!.params!.xCoord = xCoord
          nodeChild.to!.params!.yCoord = yCoord
        } else {
          nodeChild.to!.name = 'MetocDataViewer'
        }
      })
    })
  }
}
</script>
