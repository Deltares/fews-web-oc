import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import SchematicStatusDisplay from '../views/SchematicStatusDisplay.vue'
import SpatialDisplay from '../views/SpatialDisplay.vue'
import Silent from '../views/auth/Silent.vue'
import Callback from '../views/auth/Callback.vue'
import LoginView from '../views/LoginView.vue'
import Logout from '../views/auth/Logout.vue'
import ComponentsPanel from '../components/Layout/ComponentsPanel.vue'
import SystemMonitor from '../views/SystemMonitorDisplay.vue'
import { configManager } from '../services/application-config'
import TimeSeriesDisplay from '../views/TimeSeriesDisplay.vue'
import SSDTimeSeriesDisplay from '../views/SSDTimeSeriesDisplay.vue'
import DataView from '../views/DataView.vue'

import oidcSettings from '../services/config'
import { Log, UserManager } from 'oidc-client-ts'

Log.setLogger(console)
Log.setLevel(Log.WARN)

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: { name: 'DataViewer' },
  },
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'empty' },
    component: LoginView
  },
  {
    path: '/dataviewer/:filterId?/:categoryId?',
    name: 'DataViewer',
    component: DataView,
    props: route => ({...route.params, layerName: route.query.layerName }),
    meta: { authorize: [], sidebar: true },
    children: [
      {
        path: 'location/:locationId',
        name: 'DataViewerWithLocation',
        component: ComponentsPanel,
        props: route => ({...route.params, layerName: route.query.layerName }),
        meta: { authorize: [], sidebar: true }
      }
    ]
  },
  {
    // /ssd/group/ScadaNZK-ARK/panel/NZK_ARK_10min
    path: '/ssd/:groupId?/:panelId?',
    name: 'SchematicStatusDisplay',
    component: SchematicStatusDisplay,
    props: true,
    meta: { authorize: [], sidebar: true },
    children: [
      {
        path: ':objectId',
        name: 'SSDTimeSeriesDisplay',
        component: SSDTimeSeriesDisplay,
        props: true,
        meta: { authorize: [], sidebar: true }
      }
    ]
  },
  {
    path: '/map/:layerName?',
    name: 'SpatialDisplay',
    component: SpatialDisplay,
    props: true,
    meta: { authorize: [], sidebar: true }
  },
  {
    // /series/workflow/Plateau1_MD
    path: '/series/node/:nodeId?',
    name: 'TimeSeriesDisplay',
    component: TimeSeriesDisplay,
    props: true,
    meta: { authorize: [], sidebar: true }
  },
  {
    path: '/systemmonitor',
    name: 'SystemMonitor',
    component: SystemMonitor,
    meta: { authorize: [] }
  },
  {
    path: '/auth/silent',
    meta: { layout: 'empty' },
    component: Silent
  },
  {
    path: '/auth/callback',
    meta: { layout: 'empty' },
    component: Callback
  },
  {
    path: '/auth/logout',
    meta: { layout: 'empty' },
    component: Logout
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(async (to, from, next) => {
  // redirect to login page if not logged in and trying to access a restricted page
  const authorize = to.meta?.authorize
  if (authorize && configManager.authenticationIsEnabled) {
    const settings = configManager.getUserManagerSettings()
    const authenticationService = new UserManager(settings)
    const currentUser = await authenticationService.getUser()
    if (currentUser === null) {
      return next({ name: 'Login', query: { redirect: to.name } })
    }

    const role = currentUser.profile.roles !== undefined ? (currentUser.profile as any).roles[0] : 'guest'
    if (authorize.length && !authorize.includes(role)) {
      return next({ name: 'DataViewer' })
    }
  }
  next()
})

export default router
