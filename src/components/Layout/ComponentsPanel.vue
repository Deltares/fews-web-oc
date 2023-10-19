<template>
  <div class="panel">
    <div class="panel-scroll">
      <WindowComponent v-for="display in displays" :key="display.id" :class="display.class"
        :title="display.title" :displayTypes="display.types">
        <template v-slot="{displayType}">
          <component :is="displayType" :value="displayConfig(display, displayType)" :series="series" :key="display.id">
          </component>
        </template>
        <template v-slot:toolbar-append>
          <CSVExportComponent :series="series" :value="displayConfig(display, timeSeriesTableType)" class="csv-export"/>
        </template>
      </WindowComponent>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import TimeSeriesChart from '@/components/TimeSeriesComponent/ConfigurableChart.vue'
import ElevationChart from '@/components/TimeSeriesComponent/ElevationChart.vue'
import TimeSeriesTable from '@/components/TimeSeriesComponent/TimeSeriesTable.vue'
import WindowComponent from "@/components/Layout/WindowComponent.vue"
import CSVExportComponent from '@/components/CSVExportComponent.vue'
import { Series } from "@/lib/TimeSeries";
import { DisplayConfig, DisplayType } from '@/lib/Layout/DisplayConfig'

@Component({
  components: {
    TimeSeriesChart,
    ElevationChart,
    TimeSeriesTable,
    WindowComponent,
    CSVExportComponent,
  },
})
export default class ComponentsPanel extends Vue {

  @Prop({ default: true })
  panel!: boolean[]

  @Prop({ default: true })
  focus!: boolean[]

  @Prop({ default: () => { return {} } })
  displays!: { [key: string]: DisplayConfig}

  @Prop({default: () => {return {}} })
  series!: Record<string, Series>

  timeSeriesTableType = DisplayType.TimeSeriesTable

  displayConfig(display: DisplayConfig, displayType: string){
    const idx = Object.keys(display.types).filter((key: any) => display.types[key] === displayType)[0] ?? 0
    return display.config[+idx]
  }
}
</script>

<style scoped>
.panel {
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

.panel-scroll {
  display: flex;
  position: relative;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.single {
  width: 100%;
  flex: 1 1 50%;
  min-height: 400px;
}

.double {
  width: 100%;
  flex: 1 1 50%;
  min-height: 500px;
}

.panel-chart-container {
  display: block;
  height: 400px;
  width: 100%;
}

.csv-export{
  margin-left: auto;
  padding: 10px 0px;
}
</style>
