import {
  defineAsyncComponent,
  defineComponent,
  getCurrentInstance,
  h,
  ref,
  watch,
} from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'
import { getDefaultSettings } from '@/lib/topology/componentSettings'
import { configManager } from '@/services/application-config'

const TimeSeriesDisplay = defineAsyncComponent(
  () => import('./TimeSeriesDisplay.vue'),
)

export const SelectionMenu = defineComponent({
  props: {
    plotId: { type: String, default: undefined },
    routePlotId: { type: String, default: undefined },
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
      routes: [{ path: '/', component: { render: () => null } }],
    })
    getCurrentInstance()!.appContext.app.use(router)
    void router.replace({
      path: '/',
      query: { keep: 'value', plotId: props.routePlotId },
      hash: '#selection',
    })
    watch(
      () => props.routePlotId,
      (plotId) => {
        void router.replace({
          query: { ...router.currentRoute.value.query, plotId },
          hash: router.currentRoute.value.hash,
        })
      },
    )
    const settings = getDefaultSettings()
    settings.charts.general.toolBar = 'true'
    settings.charts.timeSeriesChart.enabled = false
    settings.charts.timeSeriesTable.enabled = false
    settings.charts.verticalProfileChart.enabled = false
    settings.charts.metaDataPanel.enabled = false
    settings.charts.actions.downloadData = false

    return () =>
      h('div', { style: { height: '500px' } }, [
        h(TimeSeriesDisplay, {
          nodeId: 'selection-test',
          plotId: props.plotId,
          settings,
        }),
        h('input', {
          type: 'hidden',
          'data-testid': 'route-plot-id',
          value: router.currentRoute.value.query.plotId ?? '',
        }),
        h('input', {
          type: 'hidden',
          'data-testid': 'route-full-path',
          value: router.currentRoute.value.fullPath,
        }),
      ])
  },
})
