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
import { Log, UserManager } from 'oidc-client-ts'

Log.setLogger(console)
Log.setLevel(Log.WARN)

const authenticationService = new UserManager(oidcSettings)

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
    path: '/current',
    name: 'Map',
    component: Home,
    meta: { authorize: [] }
  },
  {
    path: '/ssd',
    name: 'Ssd',
    component: SsdComponent,
    props: { src: 'https://rwsos-dataservices-ont.avi.deltares.nl/iwp/FewsWebServices/ssd?request=GetDisplay&ssd=Overzichtsscherm_WMCN' },
    meta: { authorize: [] }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: DisplayComponent,
    meta: { authorize: [] }
  },
  {
    path: '/display',
    name: 'Display',
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
    path: '/system',
    name: 'System',
    component: DisplayComponent,
    meta: { authorize: [] }
  },
  {
    path: '/help',
    name: 'Help',
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
