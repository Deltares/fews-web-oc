import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AboutView from '../views/AboutView.vue'

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
  //   {
  //     path: '/login',
  //     name: 'Login',
  //     meta: { layout: 'empty' },
  //     component: LoginView
  //   },
  //   {
  //     path: '/auth/silent',
  //     meta: { layout: 'empty' },
  //     component: Silent
  //   },
  //   {
  //     path: '/auth/callback',
  //     meta: { layout: 'empty' },
  //     component: Callback
  //   },
  //   {
  //     path: '/auth/logout',
  //     meta: { layout: 'empty' },
  //     component: Logout
  //   }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routesBase,
})

export default router
