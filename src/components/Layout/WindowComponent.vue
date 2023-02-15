<template>
  <div class="window-component" :class="{ fullscreen }" >
    <v-btn
      v-if="fullscreen"
      fab
      small
      right
      absolute
      @click="toggleFullscreen()"
    >
      <v-icon>mdi-fullscreen-exit</v-icon>
    </v-btn>
    <v-toolbar :color="$vuetify.theme.dark ? '#1E1E1E' : '#FFFFFF'" dense flat style="flex-grow:0">
      <v-spacer />
      {{ title }}
      <v-spacer />
      <v-btn icon @click="toggleFullscreen()" v-if="!fullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
    </v-toolbar>
    <v-sheet fluid style="display: flex; flex: 1 1 100%; flex-direction: column; height: 100%">
      <slot></slot>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'


@Component
export default class WindowComponent extends Vue {
  @Prop( {default: '', type: String}) title!: string
  fullscreen = false

  get fullscreenIcon (): string {
    return this.fullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
  }

  toggleFullscreen (): void {
    this.fullscreen = !this.fullscreen
  }
}

</script>

<style>
.window-component {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.window-component.fullscreen {
  position: fixed;
  flex-grow: 1 1 80%;
  top: 0px;
  right: 0px;
  width: 100%;
  z-index: 9000;
  opacity: .99;
}
</style>
