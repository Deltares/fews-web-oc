import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    layout?: 'EmptyLayout' | 'DefaultLayout'
    sidebar?: boolean
    authorize?: string[]
  }
}
