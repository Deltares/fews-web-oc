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
import { Component, Mixins } from 'vue-property-decorator'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests';

import { Category, fetchCategories } from '@/lib/Topology'
import type { ColumnItem } from '@/components/ColumnItem';
import TreeMenu from '@/components/TreeMenu.vue';
import PiRequestsMixin from '@/mixins/PiRequestsMixin';

@Component({
  components: {
    TreeMenu
  }
})
export default class MetocSidebar extends Mixins(PiRequestsMixin) {
  baseUrl: string = ''
  webServiceProvider: PiWebserviceProvider = {} as PiWebserviceProvider;

  activeNodes: string[] = []
  openNodes: string[] = []

  categories: Category[] = []

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl, {transformRequestFn});
    this.categories = await fetchCategories(this.webServiceProvider)
  }

  get nodes(): ColumnItem[] {
    return this.categories.map(category => {
      return {
        id: category.id,
        name: category.name,
        children: category.dataLayers.map(dataLayer => {
          return {
            id: dataLayer.id,
            name: dataLayer.name
            // to: TODO: change route based on category/data layer/model
          }
        })
      }
    })
  }
}
</script>