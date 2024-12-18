import { configManager } from '@/services/application-config/index.ts'
import {
  PiWebserviceProvider,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

/**
 * Fetch the topology nodes from the FEWS web services.
 *
 * @returns {Promise<TopologyNode[]>} - An array of TopologyNode objects.
 */
export async function getTopologyNodes(): Promise<TopologyNode[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  let nodes: TopologyNode[] = []
  try {
    const response = await piProvider.getTopologyNodes()
    nodes = response.topologyNodes
  } catch (error) {
    error = 'error-loading'
  }

  return nodes
}
