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
import { authenticationService } from '@/services/auth'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { authorize: [] }
  },
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'empty' },
    component: LoginView
  },
  {
    path: '/map',
    name: 'MapComponent',
    component: MapComponent,
    meta: { authorize: ['FEWS_FORECASTER'] }
  },
  {
    path: '/ssd',
    name: 'SsdComponent',
    component: SsdComponent,
    meta: { authorize: ['FEWS_FORECASTER'] }
  },
  {
    path: '/display',
    name: 'DisplayComponent',
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
      return next({ path: '/login', query: { redirect: to.path } })
    }

    // TODO: check alle roles
    if (authorize.length && !authorize.includes(currentUser.profile.roles[0])) {
      return next({ path: '/' })
    }
  }
  next()
})

export default router
