export interface DashboardsResponse {
  dashboards: Dashboard[]
}

export interface Dashboard {
  id: string
  cssTemplate: string
  groups: DashboardGroup[]
}

export interface DashboardGroup {
  elements: DashboardElement[]
}

export interface DashboardElement {
  gridTemplateArea: string
  items: DashboardItem[]
}

export interface DashboardItem {
  topologyNodeId: string
  component: string
  componentSettingsId: string
}
