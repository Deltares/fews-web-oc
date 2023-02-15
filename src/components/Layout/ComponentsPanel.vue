<template>
  <div class="panel">
    <div class="panel-scroll">
      <WindowComponent v-for="display in displays" :key="display.id" :class="display.class"
        :title="display.title">
        <component :is="display.type" :value="display.config" :series="series" :key="display.id">
        </component>
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
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
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
