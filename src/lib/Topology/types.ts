export interface Category {
  id: string
  name: string
  dataLayers: DataLayer[]
}

export interface DataLayer {
  id: string
  name: string
  dataSources: DataSource[]
}

export interface DataSource {
  id: string
  name: string
  filterIds: string[]
  wmsLayerId: string
}
