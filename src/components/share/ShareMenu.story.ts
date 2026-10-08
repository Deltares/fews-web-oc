import {
  defineAsyncComponent,
  defineComponent,
  getCurrentInstance,
  h,
  ref,
  watch,
  type PropType,
} from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'
import { configManager } from '@/services/application-config'
import { getDefaultSettings } from '@/lib/topology/componentSettings'
import { DisplayType, type DisplayConfig } from '@/lib/display/DisplayConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'

const ShareMenu = defineAsyncComponent(() => import('./ShareMenu.vue'))
const TimeSeriesComponent = defineAsyncComponent(
  () => import('@/components/timeseries/TimeSeriesComponent.vue'),
)

export const ParameterSelection = defineComponent({
  props: {
    parameterIds: { type: Array as PropType<string[]>, default: undefined },
    map: { type: Boolean, default: false },
    showChart: { type: Boolean, default: true },
  },
  setup(props) {
    configManager.update({
      VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews`,
    })
    provideHostWebserviceContext({
      getBaseUrl: () => configManager.get('VITE_FEWS_WEBSERVICES_URL'),
      getAuthorizationHeaders: () => Promise.resolve(new Headers()),
    })
    provideHostRefreshContext({ systemTick: ref<Date>() })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:embed?/map/:locationIds',
          name: 'TopologySpatialDisplay',
          component: { render: () => null },
        },
        {
          path: '/:embed?/chart/:locationIds',
          name: 'TopologySpatialTimeSeriesDisplay',
          component: { render: () => null },
        },
      ],
    })
    getCurrentInstance()!.appContext.app.use(router)
    watch(
      () => props.parameterIds,
      (parameterIds) => {
        void router.replace({
          name: props.map
            ? 'TopologySpatialDisplay'
            : 'TopologySpatialTimeSeriesDisplay',
          params: { locationIds: 'location' },
          query: { keep: 'existing', parameterIds },
        })
      },
      { immediate: true },
    )
    const settings = getDefaultSettings().charts
    settings.timeSeriesChart.legend.placement = 'above chart'
    const displayType = ref(DisplayType.TimeSeriesChart)
    const series = (id: string): ChartSeries => ({
      id,
      parameterId: id,
      dataResources: [],
      name: id,
      type: 'line',
      options: {
        x: { key: 'x', axisIndex: 0 },
        y: { key: 'y', axisIndex: 0 },
      },
      unit: '',
      style: { stroke: 'black' },
      visibleInLegend: true,
      visibleInPlot: true,
      visibleInTable: true,
    })
    const config: DisplayConfig = {
      id: 'share',
      nodeId: undefined,
      plotId: undefined,
      index: 0,
      title: 'Share chart',
      forecastLegend: undefined,
      class: '',
      requests: [],
      period: undefined,
      subplots: [
        {
          id: 'mixed',
          title: '',
          series: [series('level'), series('discharge')],
        },
        { id: 'rain', title: '', series: [series('rain')] },
      ],
    }
    return () =>
      h('div', [
        h(ShareMenu),
        props.showChart
          ? h('div', { 'data-testid': 'charts', style: { height: '500px' } }, [
              h(TimeSeriesComponent, {
                config,
                settings,
                displayType: displayType.value,
                'onUpdate:displayType': (value: DisplayType) => {
                  displayType.value = value
                },
              }),
            ])
          : null,
      ])
  },
})
