import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
  RouteRecordNormalized,
  RouteRecordRaw,
} from 'vue-router'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/auth/LoginView.vue'
import Callback from '../views/auth/Callback.vue'
import Logout from '../views/auth/Logout.vue'
import Silent from '../views/auth/Silent.vue'
import { configManager } from '../services/application-config'
import { authenticationManager } from '../services/authentication/AuthenticationManager'
import { useConfigStore } from '../stores/config.ts'
import { hasDefaultPath, type WebOcComponent } from '@/lib/fews-config/types.ts'

const SystemMonitorDisplayView = () =>
  import('../views/SystemMonitorDisplayView.vue')
const SchematicStatusDisplayView = () =>
  import('../views/SchematicStatusDisplayView.vue')
const SchematicStatusDisplay = () =>
  import('../components/ssd/SchematicStatusDisplay.vue')
const SpatialDisplayView = () => import('../views/SpatialDisplayView.vue')
const SpatialDisplay = () =>
  import('../components/spatialdisplay/SpatialDisplay.vue')
const SpatialTimeSeriesDisplay = () =>
  import('../components/spatialdisplay/SpatialTimeSeriesDisplay.vue')
const WhatIfDisplayView = () => import('../views/WhatIfDisplayView.vue')
const TimeSeriesDisplayView = () => import('../views/TimeSeriesDisplayView.vue')
const TopologyDisplayView = () => import('../views/TopologyDisplayView.vue')
const DataDownloadDisplayView = () =>
  import('../views/DataDownloadDisplayView.vue')
const TimeSeriesDisplay = () =>
  import('../components/timeseries/TimeSeriesDisplay.vue')
const DynamicReportDisplayView = () =>
  import('../views/DynamicReportDisplayView.vue')
const HtmlDisplayView = () => import('../views/HtmlDisplayView.vue')
const ReportsDisplayView = () => import('../views/ReportsDisplayView.vue')
const WebDisplay = () => import('../components/webdisplay/WebDisplay.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const LogDisplayView = () => import('../views/LogDisplayView.vue')
const DataAnalysisDisplay = () =>
  import('../components/analysis/DataAnalysisDisplay.vue')
const Empty = () => import('../views/Empty.vue')
const DocumentDisplayView = () => import('../views/DocumentDisplayView.vue')
const PluginDisplayView = () => import('../views/PluginDisplayView.vue')

const routesBase: Readonly<RouteRecordRaw[]> = [
  {
    path: '/',
    name: 'Default',
    component: AboutView,
  },
  {
    path: '/about',
    name: 'About',
    meta: { title: 'About' },
    component: AboutView,
  },
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'EmptyLayout' },
    component: LoginView,
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    meta: { layout: 'EmptyLayout' },
    component: Callback,
  },
  {
    path: '/auth/silent',
    name: 'AuthSilent',
    meta: { layout: 'EmptyLayout' },
    component: Silent,
  },
  {
    path: '/auth/logout',
    name: 'AuthLogout',
    meta: { layout: 'EmptyLayout' },
    component: Logout,
  },
]

export const dynamicRoutes: Readonly<RouteRecordRaw[]> = [
  {
    path: '/dataviewer/:filterId?/:categoryId?',
    name: 'DataViewer',
    component: Empty,
    props: (route) => ({ ...route.params, layerName: route.query.layerName }),
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/ssd/:groupId?/:panelId?',
    name: 'SchematicStatusDisplay',
    component: SchematicStatusDisplayView,
    props: true,
    meta: { sidebar: true },
    children: [
      {
        path: 'object/:objectId',
        name: 'SSDTimeSeriesDisplay',
        component: SchematicStatusDisplayView,
        props: true,
        meta: { sidebar: true },
      },
    ],
  },
  {
    path: '/systemmonitor',
    name: 'SystemMonitor',
    component: SystemMonitorDisplayView,
  },
  {
    path: '/map/:layerName?',
    name: 'SpatialDisplay',
    component: SpatialDisplayView,
    props: true,
    meta: { sidebar: true },
    children: [
      {
        path: 'coordinates/:latitude/:longitude',
        name: 'SpatialDisplayWithCoordinates',
        component: Empty,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'location/:locationId',
        name: 'SpatialDisplayWithLocation',
        component: Empty,
        props: true,
        meta: { sidebar: true },
      },
    ],
  },
  {
    path: '/series/node/:nodeId?',
    name: 'TimeSeriesDisplay',
    component: TimeSeriesDisplayView,
    props: true,
    meta: { sidebar: true },
  },
  {
    path: '/topology/:topologyId?/node/:nodeId*',
    name: 'TopologyDisplay',
    component: TopologyDisplayView,
    props: true,
    meta: { sidebar: true },
    children: [
      {
        path: 'download',
        name: 'TopologyDataDownload',
        component: DataDownloadDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'series',
        name: 'TopologyTimeSeries',
        component: TimeSeriesDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'reports',
        name: 'TopologyReports',
        component: ReportsDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'documents/:productKey?',
        name: 'TopologyDocumentDisplay',
        component: DocumentDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'dynamicreport',
        name: 'TopologyDynamicReports',
        component: DynamicReportDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'dashboard',
        name: 'TopologyDashboard',
        component: DashboardView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'ssd/:panelId?',
        name: 'TopologySchematicStatusDisplay',
        component: SchematicStatusDisplay,
        props: true,
        meta: { sidebar: true },
        children: [
          {
            path: 'object/:objectId',
            name: 'TopologySSDTimeSeriesDisplay',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
        ],
      },
      {
        path: 'systemmonitor',
        name: 'TopologySystemMonitor',
        component: SystemMonitorDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'embed',
        name: 'TopologyWebDisplay',
        component: WebDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'log',
        name: 'TopologyLogDisplay',
        component: LogDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'chart/:layerName?',
        name: 'TopologySpatialTimeSeriesDisplay',
        component: SpatialTimeSeriesDisplay,
        props: true,
        meta: { sidebar: true },
        children: [
          {
            path: 'location/:locationIds',
            name: 'TopologySpatialTimeSeriesDisplayWithLocation',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
          {
            path: 'coordinates/:latitude/:longitude',
            name: 'TopologySpatialTimeSeriesDisplayWithCoordinates',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
        ],
      },
      {
        path: 'map/:layerName?',
        name: 'TopologySpatialDisplay',
        component: SpatialDisplay,
        props: true,
        meta: { sidebar: true },
        children: [
          {
            path: 'location/:locationIds',
            name: 'TopologySpatialDisplayWithLocation',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
          {
            path: 'coordinates/:latitude/:longitude',
            name: 'TopologySpatialDisplayWithCoordinates',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
        ],
      },
      {
        path: 'runtask',
        name: 'TopologyWhatIfDisplay',
        component: WhatIfDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'analysis',
        name: 'TopologyDataAnalysisDisplay',
        component: DataAnalysisDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'plugin',
        name: 'TopologyPluginDisplay',
        component: PluginDisplayView,
        props: true,
        meta: { sidebar: true },
        children: [
          {
            path: 'location/:locationIds',
            name: 'TopologyPluginTimeSeriesDisplay',
            component: Empty,
            props: true,
            meta: { sidebar: true },
          },
        ],
      },
    ],
  },
  {
    path: '/resources/:path?',
    name: 'HtmlDisplay',
    component: HtmlDisplayView,
    props: true,
  },
  {
    path: '/archivedisplay',
    name: 'ArchiveDisplay',
    component: Empty,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routesBase,
})

let routesAreInitialized = false

async function handleAuthorization(to: RouteLocationNormalized) {
  const currentUser = await authenticationManager.userManager.getUser()
  if (currentUser === null) {
    return {
      name: 'Login',
      query: {
        redirect: encodeURIComponent(
          to.redirectedFrom?.fullPath ?? to.fullPath,
        ),
      },
    }
  }
}

async function addDynamicRoutes() {
  const store = useConfigStore()
  await store.setFewsConfig()
  const configuredComponents = Object.values(store.components)

  configuredComponents.forEach((component: any) => {
    const route = dynamicRoutes.find((route) => route.name === component.type)
    if (route !== undefined) {
      router.addRoute({
        ...route,
        path: `/:embed(embed)?${route.path}`,
      })
    } else {
      router.addRoute({
        name: component.type,
        path: `/empty/${component.type}`,
        component: Empty,
      })
    }
  })
  let defaultComponent
  if (store.defaultComponent !== undefined) {
    defaultComponent = store.defaultComponent
  } else if (configuredComponents.length > 0) {
    // Set first component as default if no default is set
    defaultComponent = configuredComponents[0]
  }
  if (defaultComponent && router.hasRoute(defaultComponent.type)) {
    const isTopology = defaultComponent.type === 'TopologyDisplay'
    // Ensure topologyId param is present for default topology display
    const redirectTarget = isTopology
      ? {
          name: 'TopologyDisplay',
          params: { topologyId: defaultComponent.id },
        }
      : { name: defaultComponent.type }

    router.removeRoute('Default')
    router.addRoute({
      path: '/',
      redirect: redirectTarget,
      name: 'Default',
    })
  }
}

function applyDefaultPathParams(
  component: WebOcComponent,
  params: RouteLocationNormalized['params'],
): boolean {
  if (!hasDefaultPath(component) || !component.defaultPath) return false

  let changed = false
  for (const [key, value] of Object.entries(component.defaultPath)) {
    if (value === undefined || params[key]) continue
    params[key] =
      component.type === 'TopologyDisplay' && key === 'nodeId'
        ? value.split('/')
        : value
    changed = true
  }
  return changed
}

function applyHtmlDisplayPath(
  component: WebOcComponent,
  params: RouteLocationNormalized['params'],
): boolean {
  if (component.type !== 'HtmlDisplay' || !component.path || params.path) {
    return false
  }
  params.path = component.path
  return true
}

function defaultRouteParams(to: RouteLocationNormalized) {
  const store = useConfigStore()
  const route = to.name === undefined ? router.resolve(to) : to
  const component = store.getComponentByRoute(route)
  if (component === undefined) return

  const params = to.params
  const pathChanged = applyDefaultPathParams(component, params)
  const htmlChanged = applyHtmlDisplayPath(component, params)

  if (pathChanged || htmlChanged) {
    to.params = params
    return to
  }
}

router.beforeEach(async (to) => {
  let redirect: string | undefined = undefined
  if (to.name === 'Login' || to.name === 'AuthLogout') return
  if (to.name === 'AuthCallback') {
    try {
      const user =
        await authenticationManager.userManager.signinRedirectCallback()
      if (user.state) redirect = decodeURIComponent(user.state.toString())
    } catch (error) {
      console.error(error)
    }
  }

  if (configManager.authenticationIsEnabled) {
    const redirectToLogin = await handleAuthorization(to)
    if (redirectToLogin) return redirectToLogin
  }

  if (!routesAreInitialized) {
    await addDynamicRoutes()
    routesAreInitialized = true
    if (redirect) {
      return redirect
    }
    return to
  }
  return defaultRouteParams(to)
})

export function findParentRoute(
  route: RouteLocationNormalized,
): RouteRecordNormalized | null {
  let found: RouteRecordNormalized | null = null
  router.getRoutes().forEach((r) => {
    r.children.forEach((child) => {
      if (child.name === route.name) {
        found = r
      }
    })
  })
  return found
}

export default router
