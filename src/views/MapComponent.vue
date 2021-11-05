<template>
  <div class="map-container">
    <v-mapbox
      :access-token="accessToken"
      map-style='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      :center="[5, 51]"
      :zoom="6"
      :pitch="0"
      :bearing="0"
      :min-zoom="5"
      :interactive="true"
      :drag-pan="true"
      :scroll-zoom="true"
      class="map"
      ref="map"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MapComponent extends Vue {
  accessToken = process.env.VUE_APP_MAPBOX_TOKEN
  mounted (): void {
    const map = (this.$refs.map as any).map
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
