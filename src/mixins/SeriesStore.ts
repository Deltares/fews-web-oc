import { Vue, Component } from 'vue-property-decorator'
import { Series } from '@/lib/TimeSeries'

@Component
export default class TimeSeriesStore extends Vue {
  timeSeriesStore: Record<string, Series> = {}





}

