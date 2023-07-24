import { PiWebserviceProvider, TopologyNode } from "@deltares/fews-pi-requests";

import { Category, DataLayer, DataSource } from "./types";

export async function fetchCategories(provider: PiWebserviceProvider): Promise<Category[]> {
  const response = await provider.getTopologyNodes();

  // Top-level nodes are categories. We only keep categories that contain data layers.
  const categories = response.topologyNodes
    .map(parseCategory)
    .filter(category => category.dataLayers.length > 0)
  return categories
}

function parseCategory(response: TopologyNode): Category {
  // Any children are dataLayers, which may contain multiple data sources. We only keep data layers
  // that contain data sources.
  const dataLayers = (response.topologyNodes ?? [])
    .map(parseDataLayer)
    .filter(layer => layer.dataSources.length > 0)
  return {
    id: response.id,
    name: response.name,
    dataLayers
  }
}

function parseDataLayer(response: TopologyNode): DataLayer {
  const dataSources = (response.topologyNodes ?? [])
    .filter(isValidDataSource)
    .map(parseDataSource)
  return {
    id: response.id,
    name: response.name,
    dataSources
  }
}

function isValidDataSource(response: TopologyNode): boolean {
  // TODO: remove cast once fews-pi-requests has been updated with the new response type.
  const data = response as any
  return data.filterIds && data.gridDisplaySelection?.plotId
}

function parseDataSource(response: TopologyNode): DataSource {
  // TODO: remove cast once fews-pi-requests has been updated with the new response type.
  const data = response as any
  return {
    id: response.id,
    name: response.name,
    filterIds: data.filterIds ?? [],
    wmsLayerId: data.gridDisplaySelection.plotId
  }
}
