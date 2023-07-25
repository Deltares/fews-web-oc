<template>
  <div>
    <TreeMenu
      :active.sync="activeNodes"
      :items="nodes"
      :open.sync="openNodes"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

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

  baseUrl: string = ''

  activeNodes: string[] = []
  openNodes: string[] = []

  get nodes(): ColumnItem[] {
    return this.categories.map(category => {
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
  }
}
</script>