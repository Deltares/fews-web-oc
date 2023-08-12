<template>
  <div class="window-component" :class="{ fullscreen }" >
    <v-toolbar
      :color="$vuetify.theme.dark ? '#1E1E1E' : '#FFFFFF'"
      dense
      flat
      class="toolbar"
    >
      <v-spacer />
      {{ title }}
      <v-spacer />
      <v-btn-toggle class="mr-5" group @change="onDisplayTypeChange" mandatory>
        <v-btn
          v-for="item in displayTypeItems"
          :key="item.value"
          :aria-label="item.label"
          small text
        >
          <v-icon>{{ item.icon }}</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-btn small text @click="toggleFullscreen()">
        <v-icon>{{ fullscreenIcon }}</v-icon>
      </v-btn>  
      <slot name="toolbar-append" v-bind:refs="$refs"></slot>
    </v-toolbar>
    <v-sheet fluid class="component-container">
      <slot :displayType="displayType"></slot>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { DisplayType } from '@/lib/Layout/DisplayConfig'

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
}

@Component
export default class WindowComponent extends Vue {
  @Prop( {default: '', type: String}) title!: string
  @Prop( {default: () => { return [] }}) displayTypes!: DisplayType[]

  fullscreen = false

  displayType = DisplayType.TimeSeriesChart
  displayTypeItems: DisplayTypeItem[] = []

  mounted(): void {
    this.updateDisplayTypeItems()
  }

  get fullscreenIcon(): string {
    return this.fullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'
  }

  toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen
  }

  onDisplayTypeChange(selectedIndex: number): void {
    this.displayType = this.displayTypeItems[selectedIndex].value
  }

  @Watch('displayTypes')
  updateDisplayTypeItems(): void {
    const displayTypeToItem = (displayType: DisplayType): DisplayTypeItem => {
      switch (displayType) {
        case DisplayType.TimeSeriesChart:
          return {
            icon: 'mdi-chart-line',
            label: 'Chart',
            value: displayType
          }
        case DisplayType.TimeSeriesTable:
          return {
            icon: 'mdi-table',
            label: 'Table',
            value: displayType
          }
        default:
          return {
            icon: 'mdi-alert',
            label: 'Unknown display type',
            value: displayType
          }
      }
    }
    this.displayTypeItems = this.displayTypes.map(displayTypeToItem)
  }
}
</script>

<style scoped>
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

.toolbar {
  flex-grow: 0;
}
</style>
