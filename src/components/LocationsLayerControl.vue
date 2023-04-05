<template>
  <v-chip pill :color="$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'" style="backdrop-filter: blur(4px);">
    <v-switch v-model="show" @click.stop @change="onShowChange"></v-switch>
    <v-icon>mdi-map-marker</v-icon>
    Locations
  </v-chip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

export interface LocationsLayerControlValue {
  name: string;
  active: boolean;
}

@Component
export default class LocationsLayerControl extends Vue {
  @Prop({ default: () => { return {
    name: '',
    active: true
  }}}) value!: LocationsLayerControlValue;

  show = true

  onShowChange() {
    this.$emit('input', this.show)
  }
}
</script>

<style scoped>
</style>
