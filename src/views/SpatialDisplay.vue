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
    <div class="map-container">
      <v-mapbox
        :access-token="accessToken"
        map-style='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        :center="[54, 25]"
        :zoom="5"
        :pitch="0"
        :bearing="0"
        :min-zoom="2"
        :interactive="true"
        :drag-pan="true"
        :scroll-zoom="true"
        class="map"
        ref="map"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Map } from 'mapbox-gl'
import { ColumnItem } from '@/components/ColumnItem'
import ColumnMenu from '@/components/ColumnMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'

@Component({
  components: {
    ColumnMenu,
    DateTimeSlider,
  }
})
export default class MapComponent extends Vue {
  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  open: string[] = []
  items: ColumnItem[] = []
  drawer = true
  viewMode = 0

  mounted (): void {
    console.log('mounted')
    this.loadCapabilities()
    const map: Map = (this.$refs.map as any).map
    map.on('load', () => {
      map.addSource('adoos', {
        type: 'raster',
        // use the tiles option to specify a WMS tile source URL
        // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
        tiles: [
          'https://rwsos-dataservices-ont.avi.deltares.nl/adoos/FewsWebServices/wms?service=WMS&request=GetMap&version=1.3&layers=AGM_Currents_FM&styles=Class.Wind.Speed&format=image%2Fpng&transparent=true&crs=EPSG:3857&showContours=false&uppercase=false&bbox={bbox-epsg-3857}&height=512&width=512'
        ],
        tileSize: 512
      })
      map.addLayer(
        {
          id: 'wms-test-layer',
          type: 'raster',
          source: 'adoos',
          paint: {}
        },
        'aeroway-runway'
      )
    })
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
      const group = layers.find((l) => l.groupName === groupName)
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

<style scoped>
.map-container {
  height: 100%;
}

.map {
  height: 100%;
  width: 100%;
}
</style>
