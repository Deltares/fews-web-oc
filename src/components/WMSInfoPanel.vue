<template>
  <v-menu
    v-model="showInfoPanel"
    bottom
    right
    offset-y
    transition="slide-y-transition"
    origin="top left"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on }">
      <v-chip
        v-on="on"
        :color="backgroundColor"
        class="chip"
      >
        <span class="mr-2">{{ layerName }} {{ unitLabel }}</span>
        <v-icon>mdi-information-outline</v-icon>
      </v-chip>
    </template>
    <v-card class="info-panel">
      <v-card-text>
        External forecast time: {{ formattedExternalForecastTime }}
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class WMSInfoPanel extends Vue {
  @Prop({ default: '' }) layerName!: string
  @Prop({ default: null }) externalForecastTime!: Date | null
  @Prop({ default: '' }) unit!: string

  showInfoPanel: boolean = false

  get formattedExternalForecastTime(): string {
    const placeholder = '—'
    if (!this.externalForecastTime) return placeholder

    const isValidDate = !isNaN(this.externalForecastTime.getTime())
    return isValidDate ? this.externalForecastTime.toLocaleString() : placeholder
  }

  get backgroundColor(): string {
    return this.$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'
  }

  get unitLabel(): string {
    return this.unit !== '' ? `[${this.unit}]` : ''
  }
}
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
}
</style>
