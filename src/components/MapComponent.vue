<template>
  <div class="map-container">
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.0/mapbox-gl-draw.css" type="text/css">
    <v-mapbox
      :access-token="accessToken"
      :map-style=styleUrl
      :pitch="0"
      :bearing="0"
      :min-zoom="2"
      :interactive="true"
      :drag-pan="true"
      :scroll-zoom="true"
      class="map"
      ref="map"
    >
      <slot></slot>
    </v-mapbox>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {ResourceType} from "mapbox-gl";

@Component
export default class MapComponent extends Vue {
  @Prop({default: `${process.env.BASE_URL}mapbox/styles/base.json`}) styleUrl!: string
  accessToken = this.$config.get('VUE_APP_MAPBOX_TOKEN')

  beforeDestroy(){
    var map:any = this.$refs.map;
    map.map.resize = () => void 0;
  }

  mounted() {
    console.log(this.styleUrl)
    const map:any = this.$refs.map;
    map.map._requestManager._transformRequestFn = (url: string, resourceType: ResourceType) => {
      if (!this.$config.authenticationIsEnabled) return {
        url: url
      }
      if (resourceType === 'Image' && url.indexOf('GetMap') > -1) {
        const requestAuthHeaders = this.$auth.getAuthorizationHeaders()
        return {
          url: url,
          headers: requestAuthHeaders
        }
      }
      return {
        url: url
      }
    }
  }

  @Watch('styleUrl')
  updateStyle() {
    console.log(`updating: ${this.styleUrl}`)
    const map:any = this.$refs.map
    map.map.setStyle(this.styleUrl)
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
