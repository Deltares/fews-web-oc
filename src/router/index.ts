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
    name: 'Default',
    redirect: 'About',
  },
  {
    path: '/about',
    name: 'About',
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
  },
  {
    path: '/series/node/:nodeId?',
    name: 'TimeSeriesDisplay',
    component: TimeSeriesDisplayView,
    props: true,
    meta: { sidebar: true },
  },
  {
    path: '/topology/node/:nodeId?',
    name: 'TopologyDisplay',
    component: TopologyDisplayView,
    props: true,
    meta: { sidebar: true },
    children: [
      {
        path: '/topology/node/:nodeId?/series/',
        name: 'TopologyTimeSeries',
        component: TimeSeriesDisplay,
        props: true,
        meta: { sidebar: true },
      },
      {
        path: '/topology/node/:nodeId?/map/:layerName?',
        name: 'TopologySpatialDisplay',
        component: SpatialDisplay,
        props: true,
        meta: { sidebar: true },
      },
    ],
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
  const component = store.getComponentByType(route.name as string)
  if (component !== undefined) {
    const defaultPath = component.defaultPath
    const params = to.params
    for (const key in defaultPath) {
      if (defaultPath[key] !== undefined) {
        params[key] = params[key] || defaultPath[key]
      }
    }
    return params
  }
  return to.params
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
    } else if (to.path === '/about' && from.path === '/') {
      return from
    } else {
      return to
    }
  }
  to.params = defaultRouteParams(to)
  return
})

export default router
