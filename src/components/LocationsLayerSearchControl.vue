<template>
  <v-chip
    class="chip"
    :color="backgroundColor"
    pill
    label
  >
    <v-icon class="mr-2">mdi-map-marker</v-icon>
    <v-switch
      v-model="show"
      @click.stop
      @change="onShowChange"
    />
    <v-autocomplete
      v-model="selectedLocation"
      placeholder="Search Locations"
      :items="locations"
      item-text="locationName"
      return-object
      @input="onSelectLocation"
      prepend-inner-icon="mdi-magnify"
      class="ml-2"
    />
  </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Location } from '@deltares/fews-pi-requests'

@Component
export default class LocationsLayerSearchControl extends Vue {
  @Prop({ default: true }) showLocations!: boolean
  @Prop({ default: null }) locationId!: string | null
  @Prop({ default: () => [] }) locations!: Location[]

  show: boolean = true
  selectedLocation: Location | null = null

  mounted(): void{
    this.onShowLocationsChange()
  }

  onShowChange(): void {
    this.$emit('update:showLocations', this.show)
  }

  onSelectLocation(location: Location): void {
    this.$emit('update:locationId', location?.locationId ?? null)
  }

  @Watch('showLocations')
  onShowLocationsChange(): void {
    this.show = this.showLocations
  }

  @Watch('locationId')
  onLocationIdChange(): void {
    this.selectedLocation = this.locations.find(
      location => location.locationId === this.locationId
    ) ?? null
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
