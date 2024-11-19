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
import { hasDefaultPath } from '@/lib/fews-config/types.ts'

const SystemMonitorDisplayView = () =>
  import('../views/SystemMonitorDisplayView.vue')
const SchematicStatusDisplayView = () =>
  import('../views/SchematicStatusDisplayView.vue')
const SchematicStatusDisplay = () =>
  import('../components/ssd/SchematicStatusDisplay.vue')
const SSDTimeSeriesDisplay = () =>
  import('../components/ssd/SsdTimeSeriesDisplay.vue')
const SpatialDisplayView = () => import('../views/SpatialDisplayView.vue')
const SpatialDisplay = () =>
  import('../components/spatialdisplay/SpatialDisplay.vue')
const SpatialTimeSeriesDisplay = () =>
  import('../components/spatialdisplay/SpatialTimeSeriesDisplay.vue')
const TimeSeriesDisplayView = () => import('../views/TimeSeriesDisplayView.vue')
const TopologyDisplayView = () => import('../views/TopologyDisplayView.vue')
const DataDownloadDisplayView = () =>
  import('../views/DataDownloadDisplayView.vue')
const TimeSeriesDisplay = () =>
  import('../components/timeseries/TimeSeriesDisplay.vue')
const HtmlDisplayView = () => import('../views/HtmlDisplayView.vue')
const ReportsDisplayView = () => import('../views/ReportsDisplayView.vue')
const Empty = () => import('../views/Empty.vue')

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

export const embedRoutes: Readonly<RouteRecordRaw[]> = [
  {
    path: '/embed/ssd/:groupId?/:panelId?',
    name: 'Embed/SchematicStatusDisplay',
    component: SchematicStatusDisplayView,
    props: true,
    meta: { sidebar: false, layout: 'EmbedLayout' },
    children: [
      {
        path: '/embed/ssd/:groupId?/:panelId?/object/:objectId',
        name: 'Embed/SSDTimeSeriesDisplay',
        component: SSDTimeSeriesDisplay,
        props: true,
        meta: { sidebar: false, layout: 'EmbedLayout' },
      },
    ],
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
        path: '/ssd/:groupId?/:panelId?/object/:objectId',
        name: 'SSDTimeSeriesDisplay',
        component: SSDTimeSeriesDisplay,
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
        path: '/map/:layerName?/location/:locationId',
        name: 'SpatialTimeSeriesDisplay',
        component: SpatialTimeSeriesDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: '/map/:layerName?/coordinates/:latitude/:longitude',
        name: 'SpatialTimeSeriesDisplayWithCoordinates',
        component: SpatialTimeSeriesDisplay,
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
        path: 'ssd/:panelId?',
        name: 'TopologySchematicStatusDisplay',
        component: SchematicStatusDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'systemmonitor',
        name: 'TopologySystemMonitor',
        component: SystemMonitorDisplayView,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: 'map/:layerName?',
        name: 'TopologySpatialDisplay',
        component: SpatialDisplay,
        props: true,
        meta: { sidebar: true },
        children: [
          {
            path: 'location/:locationId',
            name: 'TopologySpatialTimeSeriesDisplay',
            component: SpatialTimeSeriesDisplay,
            props: true,
            meta: { sidebar: true },
          },
          {
            path: 'coordinates/:latitude/:longitude',
            name: 'TopologySpatialTimeSeriesDisplayWithCoordinates',
            component: SpatialTimeSeriesDisplay,
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
      query: { redirect: to.redirectedFrom?.path ?? to.path },
    }
  }
}

async function addDynamicRoutes() {
  const store = useConfigStore()
  await store.setFewsConfig()
  Object.values(store.components).forEach((component: any) => {
    const route = dynamicRoutes.find((route) => route.name === component.type)
    if (route !== undefined) {
      router.addRoute(route)
    } else {
      router.addRoute({
        name: component.type,
        path: `/empty/${component.type}`,
        component: Empty,
      })
    }
    const embedRoute = embedRoutes.find(
      (route) => route.name === `Embed/${component.type}`,
    )
    if (embedRoute !== undefined) {
      router.addRoute(embedRoute)
    }
  })
  if (store.defaultComponent !== undefined) {
    if (router.hasRoute(store.defaultComponent.type)) {
      router.removeRoute('Default')
      router.addRoute({
        path: '/',
        redirect: { name: store.defaultComponent.type },
        name: 'Default',
      })
    }
  }
}

function defaultRouteParams(to: RouteLocationNormalized) {
  const store = useConfigStore()
  const route = to.name === undefined ? router.resolve(to) : to
  const component = store.getComponentByRoute(route)
  if (component !== undefined) {
    const params = to.params
    let requiresRedirect = false
    if (hasDefaultPath(component) && component.defaultPath) {
      const defaultPath = component.defaultPath
      for (const [key, value] of Object.entries(defaultPath)) {
        if (value !== undefined) {
          if (!params[key]) {
            if (component.type === 'TopologyDisplay' && key === 'nodeId') {
              params[key] = value.split('/')
            } else {
              params[key] = value
            }
            requiresRedirect = true
          }
        }
      }
    }

    if (component.type === 'HtmlDisplay' && component.path) {
      const path = component.path
      if (path && !params.path) {
        params.path = path
        requiresRedirect = true
      }
    }

    if (requiresRedirect) {
      to.params = params
      return to
    }
  }
  return
}

router.beforeEach(async (to, from) => {
  let redirect: string | undefined = undefined
  if (to.name === 'Login' || to.name === 'AuthLogout') return
  if (to.name === 'AuthCallback') {
    try {
      const user =
        await authenticationManager.userManager.signinRedirectCallback()
      if (user.state) redirect = user.state.toString()
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
