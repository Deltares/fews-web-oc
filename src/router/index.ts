import {
  createRouter,
  createWebHistory,
  RouteLocationNormalized,
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

const SystemMonitorDisplayView = () =>
  import('../views/SystemMonitorDisplayView.vue')
const SchematicStatusDisplayView = () =>
  import('../views/SchematicStatusDisplayView.vue')
const SSDTimeSeriesDisplay = () =>
  import('../components/ssd/SsdTimeSeriesDisplay.vue')
const SpatialDisplayView = () => import('../views/SpatialDisplayView.vue')
const SpatialDisplay = () =>
  import('../components/spatialdisplay/SpatialDisplay.vue')
const TimeSeriesDisplayView = () => import('../views/TimeSeriesDisplayView.vue')
const TopologyDisplayView = () => import('../views/TopologyDisplayView.vue')
const TimeSeriesDisplay = () =>
  import('../components/timeseries/TimeSeriesDisplay.vue')
const UserSettingsView = () => import('../views/UserSettingsView.vue')
const Empty = () => import('../views/Empty.vue')

const routesBase: Readonly<RouteRecordRaw[]> = [
  {
    path: '/',
    redirect: { name: 'About' },
    name: 'Default',
  },
  {
    path: '/about',
    name: 'About',
    meta: { authorize: [] },
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
    meta: { layout: 'EmptyLayout' },
    component: Callback,
  },
  {
    path: '/auth/silent',
    meta: { layout: 'EmptyLayout' },
    component: Silent,
  },
  {
    path: '/auth/logout',
    meta: { layout: 'EmptyLayout' },
    component: Logout,
  },
  {
    path: '/settings',
    name: 'UserSettingsView',
    component: UserSettingsView,
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
    meta: { authorize: [], sidebar: true },
    children: [
      {
        path: '/ssd/:groupId/:panelId/:objectId',
        name: 'SSDTimeSeriesDisplay',
        component: SSDTimeSeriesDisplay,
        props: true,
        meta: { authorize: [], sidebar: true },
      },
    ],
  },
  {
    path: '/systemmonitor',
    name: 'SystemMonitor',
    component: SystemMonitorDisplayView,
    meta: { authorize: [] },
  },
  {
    path: '/map/:layerName?',
    name: 'SpatialDisplay',
    component: SpatialDisplayView,
    props: true,
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/series/node/:nodeId?',
    name: 'TimeSeriesDisplay',
    component: TimeSeriesDisplayView,
    props: true,
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/topology/node/:nodeId?',
    name: 'TopologyDisplay',
    component: TopologyDisplayView,
    props: true,
    meta: { authorize: [], sidebar: true },
    children: [
      {
        path: '/topology/node/:nodeId?/series/',
        name: 'TopologyTimeSeries',
        component: TimeSeriesDisplay,
        props: true,
        meta: { authorize: [], sidebar: true },
      },
      {
        path: '/topology/node/:nodeId?/map/:layerName?',
        name: 'TopologySpatialDisplay',
        component: SpatialDisplay,
        props: true,
        meta: { authorize: [], sidebar: true },
      },
    ],
  },
  {
    path: '/archivedisplay',
    name: 'ArchiveDisplay',
    component: Empty,
    meta: { authorize: [] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routesBase,
})

let routesAreInitialized = false

async function handleAuthorization(
  to: RouteLocationNormalized,
  authorize: string[],
) {
  const currentUser = await authenticationManager.userManager.getUser()
  if (currentUser === null) {
    return { name: 'Login', query: { redirect: to.path } }
  }

  const role =
    currentUser.profile.roles !== undefined
      ? (currentUser.profile as any).roles[0]
      : 'guest'

  if (authorize.length && !authorize.includes(role)) {
    return { name: 'About' }
  }
}

async function addDynamicRoutes() {
  const store = useConfigStore()
  await store.setFewsConfig()
  Object.values(store.components).forEach((component: any) => {
    const route = dynamicRoutes.find((route) => route.name === component.type)
    if (route !== undefined) {
      router.addRoute(route)
    }
  })
}

router.beforeEach(async (to, _from) => {
  const authorize = to.meta?.authorize as string[]
  if (authorize && configManager.authenticationIsEnabled) {
    const authPath = await handleAuthorization(to, authorize)
    if (authPath) return authPath
  }

  if (to.path === '/auth/callback') {
    try {
      const user =
        await authenticationManager.userManager.signinRedirectCallback()
      const path: string =
        user.state === null ? '/about' : (user.state as string)
      return { path }
    } catch (error) {
      console.error(error)
    }
  }

  if (!routesAreInitialized) {
    await addDynamicRoutes()
    routesAreInitialized = true
    return to
  }

  return
})

export default router
