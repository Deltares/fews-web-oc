import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AboutView from '../views/AboutView.vue'

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

export const routesViews: Readonly<RouteRecordRaw[]> = [
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
    component: Empty,
    props: true,
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/map/:layerName?',
    name: 'SpatialDisplay',
    component: Empty,
    props: true,
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/series/node/:nodeId?',
    name: 'TimeSeriesDisplay',
    component: Empty,
    props: true,
    meta: { authorize: [], sidebar: true },
  },
  {
    path: '/systemmonitor',
    name: 'SystemMonitor',
    component: Empty,
    meta: { authorize: [] },
  },
  {
    path: '/archivedisplay',
    name: 'ArchiveDisplay',
    component: Empty,
    meta: { authorize: [] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: routesBase,
})

export default router
