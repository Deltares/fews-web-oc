<template>
  <div>
    <v-navigation-drawer
    v-model="drawer"
    app
    clipped
    hide-overlay
    :right="$vuetify.rtl"
    width="320"
    class="view-sidebar"
    >
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
      <v-treeview
        v-if="viewMode === 0"
        :active.sync="active"
        :items="items"
        :open.sync="open"
        activatable
        open-on-click
        transition
        dense
      >
        <template slot="label" slot-scope="props">
          <v-list-item :to="props.item.to">{{ props.item.name }}</v-list-item>
        </template>
      </v-treeview>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </ColumnMenu>
    </v-navigation-drawer>
    <MapComponent/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MapComponent from '@/components/MapComponent.vue'
import { ColumnItem } from '@/components/ColumnItem'
import ColumnMenu from '@/components/ColumnMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'

@Component({
  components: {
    ColumnMenu,
    DateTimeSlider,
    MapComponent,
  }
})
export default class SpatialDisplay extends Vue {
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  drawer = true
  viewMode = 0

  mounted (): void {
    this.loadCapabilities()
  }

  async loadCapabilities (): Promise<void> {
    const response = await fetch('https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/wms?request=GetCapabilities&format=application/json&onlyHeaders=true')
    const capabilities = await response.json()
    const layers = capabilities.layers
    const groupNames = [...new Set(layers.map((l: any) => l.groupName))]
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Layers',
      }
    ]
    items[0].children = []
    for (const groupName of groupNames) {
      const group = layers.find((l: any) => l.groupName === groupName)
      const children: ColumnItem[] = []
      for (const layer of layers.filter((l: any) => l.groupName === groupName)) {
        children.push({
          id: layer.name,
          name: layer.title || layer.name,
        })
      }
      items[0].children.push({ id: group.groupName, name: group.groupTitle, children })
    }
    this.items = items
    this.open = [items[0].id]
  }
}
</script>
