<template>
  <div class="ssd-container">
    <div style="height: 10px;background-color: lightgray;"></div>
    <schematic-status-display src="https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN" style="height: calc(100% - 20px);">
    </schematic-status-display>
    <div style="height: 10px;background-color: lightgray;"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class SsdComponent extends Vue {
}
</script>

<style scoped>
.ssd-container {
  height: 100%;
  background-color: lightgray;
}
</style>
