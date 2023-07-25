import { PiWebserviceProvider, TopologyNode } from "@deltares/fews-pi-requests";

import { Category, DataLayer, DataSource } from "./types";

/**
 * This module contains function to parse a topology/nodes FEWS PI response as a list of categories.
 *
 * This "category" approach assumes that the topology hierarchy is configured in a specific way,
 * according to the description below.
 *
 * There should be three levels in the hierarchy:
 *     - The top level are "categories" (e.g. oceanographic, meteo, water quality);
 *     - Children of a category are "data layers", generally specific quantities (e.g. water level,
 *       currents);
 *     - Children of a data layer are "data sources", generally different models.
 *
 * We use the following members for each hierarchy layer:
 *
 *     Category nodes:
 *     - id: identifier;
 *     - name: human-readable name;
 *     - topologyNodes: data layers in this category.
 *
 *     Data layer nodes:
 *     - id: identifier
 *     - name: human-readable name;
 *     - topologyNodes: data sources in this category.
 *
 *     Data sources nodes:
 *     - id: identifier;
 *     - name: human-readable name;
 *     - filterIds: list of filterIds for to this data source;
 *     - gridDisplaySelection.plotId: WMS layer name for this data source.
 */

/**
 * Fetches a topology nodes hierarchy, and parses it as categories.
 *
 * Categories without data layers are omitted from the result.
 *
 * @param provider FEWS PI Webservices provider
 * @returns List of categories parsed from the topology nodes.
 */
export async function fetchCategories(provider: PiWebserviceProvider): Promise<Category[]> {
  const response = await provider.getTopologyNodes();

  // Top-level nodes are categories. We only keep categories that contain data layers.
  const categories = response.topologyNodes
    .map(parseCategory)
    .filter(category => category.dataLayers.length > 0)
  return categories
}

/**
 * Parses a list of categories from a topology nodes response.
 *
 * @param response FEWS PI Webservices response for a topology nodes request.
 * @returns List of categories parsed from the topology nodes.
 */
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

/**
 * Parses a data layer from a category node of a topology nodes response.
 *
 * Data layers without data sources are omitted from the result.
 *
 * @param categoryNode category node from a topology nodes response.
 * @returns List of data layers for this category.
 */
function parseDataLayer(categoryNode: TopologyNode): DataLayer {
  const dataSources = (categoryNode.topologyNodes ?? [])
    .filter(isValidDataSource)
    .map(parseDataSource)
  return {
    id: categoryNode.id,
    name: categoryNode.name,
    dataSources
  }
}

/**
 * Checks whether a topology node is a valid data source node.
 *
 * @param node topology node to check.
 * @returns Whether this node is a valid data source node.
 */
function isValidDataSource(node: TopologyNode): boolean {
  // TODO: remove cast once fews-pi-requests has been updated with the new response type.
  const data = node as any
  return data.filterIds && data.gridDisplaySelection?.plotId
}

/**
 * Parses a data source from a data layer node of a topology nodes response.
 *
 * Nodes that are not a valid data source are omitted.
 *
 * @param dataLayerNode data layer node from a topology nodes response.
 * @returns List of data sources for this data layer.
 */
function parseDataSource(dataLayerNode: TopologyNode): DataSource {
  // TODO: remove cast once fews-pi-requests has been updated with the new response type.
  const data = dataLayerNode as any
  return {
    id: data.id,
    name: data.name,
    filterIds: data.filterIds ?? [],
    wmsLayerId: data.gridDisplaySelection.plotId
  }
}
