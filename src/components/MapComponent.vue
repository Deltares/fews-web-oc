<template>
  <div class="map-container">
    <v-mapbox
      :access-token="accessToken"
      map-style='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
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
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MapComponent extends Vue {
  accessToken = this.$config.get('VUE_APP_MAPBOX_TOKEN')

  beforeDestroy(){
    var map:any = this.$refs.map;
    map.map.resize = () => void 0;
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
