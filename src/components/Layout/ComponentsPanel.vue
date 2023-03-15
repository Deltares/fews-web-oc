<template>
  <div class="panel">
    <div class="panel-scroll">
      <WindowComponent v-for="display in displays" :key="display.id" :class="display.class"
        :title="display.title" :displayTypes="display.types">
        <template v-slot="{displayType}">
          <component :is="displayType" :value="display.config" :series="series" :key="display.id">
          </component>
        </template>
      </WindowComponent>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import TimeSeriesChart from '@/components/TimeSeriesComponent/ConfigurableChart.vue'
import TimeSeriesTable from '@/components/TimeSeriesComponent/TimeSeriesTable.vue'
import WindowComponent from "@/components/Layout/WindowComponent.vue"
import { Series } from "@/lib/TimeSeries";
import type { DisplayConfig } from '@/lib/Layout/DisplayConfig'

@Component({
  components: {
    TimeSeriesChart,
    TimeSeriesTable,
    WindowComponent,
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
}
</script>

<style scoped>
.panel {
  display: flex;
  position: relative;
  flex-direction: column;
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
</style>
