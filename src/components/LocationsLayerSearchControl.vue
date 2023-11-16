<template>
  <v-chip
    class="locations-control__chip px-1"
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
        v-if="showLocations"
        v-model="selectedLocation"
        label="Search Locations"
        single-line
        hide-details
        flat
        rounded
        :items="locations"
        item-text="locationName"
        return-object
        @input="onSelectLocation"
        class="locations-control__autocomplete mb-1 pa"
        dense
        :menu-props="{
            auto: true,
            }"
    >
      <template v-slot:label="label">
        <span class="body-1">{{label}}</span>
      </template>
      <template v-slot:item="{ item, on, attrs }">
        <v-list-item class="body-1" v-on="on" v-bind="attrs">{{item.locationName}}</v-list-item>
      </template>
    </v-autocomplete>
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
.locations-control__chip {
  backdrop-filter: blur(4px);
}
</style>

<style>
.locations-control__autocomplete.v-text-field--rounded > .v-input__control > .v-input__slot {
  padding-right: 2px; 
  padding-left: 2px;
}
</style>
