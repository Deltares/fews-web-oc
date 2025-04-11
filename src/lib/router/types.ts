import type { RouteLocationNormalized } from 'vue-router'

export type NavigateRoute = Pick<RouteLocationNormalized, 'name'> &
  Partial<Pick<RouteLocationNormalized, 'params'>>
