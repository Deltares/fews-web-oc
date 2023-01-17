<template>
  <div>
    <div v-for="(display, index) in displays" :key="index">
      <time-series-component :value="display" :series="series"/>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Prop, Watch} from 'vue-property-decorator'
import TimeSeriesComponent from '@/components/TimeSeriesComponent/ConfigurableChart.vue'
import { ChartConfig } from './lib/ChartConfig'
import { Series } from '@/lib/TimeSeries'

@Component({
  components: {
    TimeSeriesComponent
  }
})
export default class Charts extends Vue {
  @Prop({default: () => {return []} })
  displays!: ChartConfig[]

  @Prop({default: () => {return {}} })
  series!: Record<string, Series>

  mounted() {
    console.log('mounted Charts', this)
  }


  @Watch('displays')
  onDisplaysChange() {
    console.log('onDisplaysChange', this.displays)
  }

  @Watch('series')
  onSeriesChange() {
    console.log('onSeriesChange', this.series)
  }
}
</script>
