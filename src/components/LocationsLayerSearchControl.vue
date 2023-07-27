<template>
  <v-chip
    class="chip"
    :color="backgroundColor"
    pill
  >
    <v-switch
      v-model="show"
      @click.stop
      @change="onShowChange"
    />
    <v-icon>mdi-map-marker</v-icon>
    Locations
  </v-chip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component
export default class LocationsLayerSearchControl extends Vue {
  @Prop({ default: true }) showLocations!: boolean;

  show = true

  onShowChange() {
    this.$emit('update:showLocations', this.show)
  }

  get backgroundColor(): string {
    return this.$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'
  }
}
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
}
</style>
