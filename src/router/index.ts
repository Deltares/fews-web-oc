import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import MapComponent from '../views/MapComponent.vue'
import SsdComponent from '../views/SsdComponent.vue'
import Silent from '../views/auth/Silent.vue'
import Callback from '../views/auth/Callback.vue'
import LoginView from '../views/LoginView.vue'
import Logout from '../views/auth/Logout.vue'
import DisplayComponent from '../views/DisplayComponent.vue'
import oidcSettings from '../services/config'
import Oidc from 'oidc-client'

Oidc.Log.logger = console
Oidc.Log.level = Oidc.Log.WARN

const authenticationService = new Oidc.UserManager(oidcSettings)

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    meta: { authorize: [] },
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'empty' },
    component: LoginView
  },
  {
    path: '/map',
    name: 'Map',
    component: MapComponent,
    meta: { authorize: ['FEWS_FORECASTER'] }
  },
  {
    path: '/ssd',
    name: 'Ssd',
    component: SsdComponent,
    meta: { authorize: ['FEWS_FORECASTER'] }
  },
  {
    path: '/display',
    name: 'Display',
    component: DisplayComponent,
    meta: { authorize: ['FEWS_FORECASTER'] }
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
    if (!currentUser) {
      return next({ name: 'Login', query: { redirect: to.name } })
    }

    // TODO: check alle roles
    const role = currentUser.profile.roles !== undefined ? currentUser.profile.roles[0] : 'guest'
    if (authorize.length && !authorize.includes(role)) {
      return next({ name: 'Home' })
    }
  }
  next()
})

export default router
