<template>
  <v-menu
    v-model="currentLayerMenu"
    bottom
    right
    offset-y
    :max-height="600"
    max-width="350"
    transition="slide-y-transition"
    origin="top left"
    :close-on-content-click="false"
  >
  <template v-slot:activator="{ on }">
    <v-chip pill v-on.self="on" :color="$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'" style="backdrop-filter: blur(4px);">
      <v-switch v-model="active" @click.stop @change="onChange(layerName)"></v-switch>
      {{ layerLabel }}
      <span style="margin-left: 10px; padding: 0 10px; border-radius: 10px; background-color: rgba(0, 0, 0, 0.7); color: white;">{{formatedTime}}</span>
      <v-icon> mdi-chevron-down </v-icon>
    </v-chip>
  </template>
    <v-card>
      <v-list>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon>mdi-layers</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ layerLabel }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Analysis time: {{ time }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item-group v-model="layerName">
          <v-list-item
            v-for="item in items"
            :key="item.name"
            :value="item.name"
            @click="onChange(item.name)"
          >
            <v-list-item-title>
              {{ getTitle(item) }}
            </v-list-item-title>
            <v-list-item-icon>
              <v-icon v-show="item.name == layerName">mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { DateTime } from 'luxon'

export interface WMSLayerControlValue {
  name: string;
  active: boolean;
}

@Component
export default class WMSLayerControl extends Vue {
  @Prop({ default: () => [] }) items!: any[];
  @Prop({ default: () => { return {
    name: '',
    active: true
  }}}) value!: WMSLayerControlValue;
  @Prop({ default: '' }) time!: string;
  @Prop({ default: () => { return new Date() } }) timeIndex!: Date;

  active = true
  layerName: string = ''
  currentLayerMenu = false

  // TODO: make value a object with layer, active, time
  mounted() {
    this.valueChange();
  }

  onChange(id: string) {
    this.$emit("change", { active: this.active, name: id} );
  }

  closeMenu() {
    this.currentLayerMenu = false
  }

  get formatedTime(): string{
    if ( isNaN(this.timeIndex.getTime()) ) {
      return '--:--'
    } else {
      const format = 'HH:mm ZZZZ'
      const timeZone = 'Europe/Amsterdam'
      const dateTime = DateTime.fromJSDate(this.timeIndex).setZone( timeZone ).setLocale('nl-NL')
      return dateTime.toFormat(format)
    }
  }

  get layerLabel(): string {
    const selectedLayer = this.items?.find((layer: any) => { return layer.name === this.layerName})
    if (selectedLayer) {
      return this.getTitle(selectedLayer)
    }
    return ''
  }

  @Watch("value", { deep: true})
  valueChange() {
    console.log('value', this.value)
    this.layerName = this.value.name;
    this.active = this.value.active
  }

  getTitle(item: any) {
    return item.title === '' ? item.name : item.title
  }

}
</script>

<style scoped>
</style>
