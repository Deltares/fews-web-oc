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
    <v-toolbar :color="$vuetify.theme.dark ? '#1E1E1E' : '#FFFFFF'" dense flat style="flex-grow:0" extension-height="24px">
      <v-spacer />
      {{ title }}
      <v-spacer />
      <v-btn icon @click="toggleFullscreen()" v-if="!fullscreen">
        <v-icon>mdi-fullscreen</v-icon>
      </v-btn>
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
      <template v-if="types.length > 1" v-slot:extension>
        <v-tabs v-model="type" centered hide-slider>
          <v-tab v-for="type, index in types" :key="index">
            {{type}}
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>
    <v-sheet fluid class="component-container">
      <v-tabs-items v-if="types.length > 1" v-model="type" style="height: 100%;">
        <v-tab-item
          v-for="type, index in types"
          :key="index"
          style="height: 100%;"
        >
          <slot :type="type"></slot>
        </v-tab-item>
      </v-tabs-items>
      <slot v-else :type="types[0]"></slot>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { DisplayType } from '@/lib/Layout/DisplayConfig'
import { Vue, Component, Prop } from 'vue-property-decorator'


@Component
export default class WindowComponent extends Vue {
  @Prop( {default: '', type: String}) title!: string
  fullscreen = false

  @Prop( {default: () => { return [] }}) types!: DisplayType[]

  type: DisplayType | null = null

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

.component-container {
  display: flex;
  flex: 1 1 100%;
  flex-direction: column;
  height: calc(100% - 72px)
}
</style>
