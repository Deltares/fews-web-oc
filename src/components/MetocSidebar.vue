<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <v-container>
      <v-row>
        <v-col>
          <v-img class="ml-6" max-width="42" contain :src="minDefLogo" />
        </v-col>
        <v-spacer/>
        <v-col>
          <v-img class="ml-6" max-width="42" contain :src="navyLogo" />
        </v-col>
      </v-row>
    </v-container>
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

  get navyLogo() {
    return `${process.env.BASE_URL}images/navy_logo.png`
  }

  get minDefLogo() {
    return `${process.env.BASE_URL}images/mindef_logo.png`
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
}
</script>
