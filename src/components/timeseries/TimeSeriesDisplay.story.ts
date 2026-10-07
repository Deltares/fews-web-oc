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
import type { NavigateRoute } from '@/lib/router'
import { useTopologyNodesStore } from '@/stores/topologyNodes'

const TimeSeriesDisplay = defineAsyncComponent(
  () => import('./TimeSeriesDisplay.vue'),
)

function prepareSelectionMenu() {
  configManager.update({
    VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews`,
  })
  provideHostWebserviceContext({
    getBaseUrl: () => configManager.get('VITE_FEWS_WEBSERVICES_URL'),
    getAuthorizationHeaders: () => Promise.resolve(new Headers()),
  })
  provideHostRefreshContext({ systemTick: ref<Date>() })
  const settings = getDefaultSettings()
  settings.charts.general.toolBar = 'true'
  settings.charts.timeSeriesChart.enabled = false
  settings.charts.timeSeriesTable.enabled = false
  settings.charts.verticalProfileChart.enabled = false
  settings.charts.metaDataPanel.enabled = false
  settings.charts.actions.downloadData = false
  return settings
}

export const SelectionMenu = defineComponent({
  props: {
    nodeId: { type: String, default: 'selection-test' },
    plotId: { type: String, default: undefined },
    routePlotId: { type: String, default: undefined },
  },
  setup(props) {
    const settings = prepareSelectionMenu()
    const navigationCount = ref(0)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/series/:plotId?',
          name: 'TimeSeriesDisplay',
          component: { render: () => null },
        },
      ],
    })
    getCurrentInstance()!.appContext.app.use(router)
    void router.replace({
      name: 'TimeSeriesDisplay',
      params: { plotId: props.routePlotId ?? props.plotId },
      query: { keep: 'value' },
      hash: '#selection',
    })
    watch(
      () => props.routePlotId,
      (plotId) => {
        void router.replace({
          name: 'TimeSeriesDisplay',
          params: { plotId },
          query: router.currentRoute.value.query,
          hash: router.currentRoute.value.hash,
        })
      },
    )
    return () => {
      const routePlotId = router.currentRoute.value.params.plotId
      return h('div', { style: { height: '500px' } }, [
        h(TimeSeriesDisplay, {
          nodeId: props.nodeId,
          plotId:
            props.plotId ??
            (typeof routePlotId === 'string' ? routePlotId : undefined),
          settings,
          onNavigate: (to: NavigateRoute) => {
            navigationCount.value += 1
            void router.replace({
              ...to,
              query: router.currentRoute.value.query,
              hash: router.currentRoute.value.hash,
            })
          },
        }),
        h('input', {
          type: 'hidden',
          'data-testid': 'navigation-count',
          value: navigationCount.value,
        }),
        h('input', {
          type: 'hidden',
          'data-testid': 'route-plot-id',
          value: router.currentRoute.value.params.plotId ?? '',
        }),
        h('input', {
          type: 'hidden',
          'data-testid': 'route-full-path',
          value: router.currentRoute.value.fullPath,
        }),
      ])
    }
  },
})

export const DashboardSelection = defineComponent({
  props: {
    actionPlotId: { type: String, default: undefined },
  },
  setup(props) {
    const settings = prepareSelectionMenu()
    const store = useTopologyNodesStore()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard', component: { render: () => null } }],
    })
    getCurrentInstance()!.appContext.app.use(router)
    void router.replace('/dashboard?keep=value#selection')
    const node = { id: 'selection-test', name: 'Selection test' }
    store.nodes = [node]
    store._idToNodeMap.set(node.id, node)
    const DashboardItem = defineAsyncComponent(
      () => import('@/components/dashboard/DashboardItem.vue'),
    )

    return () =>
      h('div', { style: { height: '500px' } }, [
        h('input', {
          type: 'hidden',
          'data-testid': 'route-full-path',
          value: router.currentRoute.value.fullPath,
        }),
        ...[0, 1].map((index) =>
          h('div', { 'data-testid': `dashboard-chart-${index}` }, [
            h(DashboardItem, {
              item: {
                component: 'charts',
                topologyNodeId: 'selection-test',
                componentSettingsId: 'selection-settings',
              },
              siblings: [],
              settings,
              actionEventBus: {
                trigger: props.actionPlotId ? 1 : 0,
                payload: {
                  charts: { displayId: props.actionPlotId },
                },
              },
            }),
          ]),
        ),
      ])
  },
})
