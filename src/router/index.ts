import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import SchematicStatusDisplay from '../views/SchematicStatusDisplay.vue'
import SpatialDisplay from '../views/SpatialDisplay.vue'
import Silent from '../views/auth/Silent.vue'
import Callback from '../views/auth/Callback.vue'
import LoginView from '../views/LoginView.vue'
import Logout from '../views/auth/Logout.vue'
import DisplayComponent from '../views/DisplayComponent.vue'
import TimeSeriesDisplay from '@/views/TimeSeriesDisplay.vue'
import oidcSettings from '../services/config'
import { Log, UserManager } from 'oidc-client-ts'

Log.setLogger(console)
Log.setLevel(Log.WARN)

const authenticationService = new UserManager(oidcSettings)

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    redirect: { name: 'Home' },
  },
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'empty' },
    component: LoginView
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { authorize: [] }
  },
  {
    // /ssd/group/ScadaNZK-ARK/panel/NZK_ARK_10min
    path: '/ssd/group/:groupId/panel/:panelId',
    name: 'SchematicStatusDisplay',
    component: SchematicStatusDisplay,
    props: true,
    meta: { authorize: [], sidebar: true }
  },
  {
    path: '/map/:layerName',
    name: 'SpatialDisplay',
    component: SpatialDisplay,
    props: true,
    meta: { authorize: [], sidebar: true }
  },
  {
    // /ssd/group/ScadaNZK-ARK/panel/NZK_ARK_10min
    path: '/series/group/:groupId/panel/:panelId',
    name: 'TimeSeriesDisplay',
    component: TimeSeriesDisplay,
    props: true,
    meta: { authorize: [], sidebar: true }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: DisplayComponent,
    meta: { authorize: [] }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: DisplayComponent,
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

  const currentUser = await authenticationService.getUser()

  if (authorize) {
    if (currentUser === null) {
      return next({ name: 'Login', query: { redirect: to.name } })
    }

    // TODO: check alle roles
    const role = currentUser.profile.roles !== undefined ? (currentUser.profile as any).roles[0] : 'guest'
    if (authorize.length && !authorize.includes(role)) {
      return next({ name: 'Home' })
    }
  }
  next()
})

export default router
