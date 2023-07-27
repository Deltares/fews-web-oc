import { ActionsResponse, ActionRequest, PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { DisplayType, DisplayConfig } from "@/lib/Layout/DisplayConfig";
import { timeSeriesDisplayToChartConfig } from "@/lib/ChartConfig/timeSeriesDisplayToChartConfig";

/**
 * Retrieves filter actions from the FEWS PI Webservice.
 *
 * @todo: Remove once this has been implemented in @deltares/fews-pi-requests.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterId FilterId to get actions for.
 * @param locationId LocationId to get the actions for.
 * @returns Filter actions response for this location and these filters.
 */
async function getFilterActions(provider: PiWebserviceProvider, filterId: string, locationId: string): Promise<ActionsResponse> {
  // Hacky way to get the base URL from the provider.
  // TODO: will this work with authentication?
  const baseUrl = provider.locationsUrl({}).href.replace('/locations', '')
  const actionsUrl = new URL(`${baseUrl}/filters/actions`)
  actionsUrl.searchParams.append('filterId', filterId)
  actionsUrl.searchParams.append('locationIds', locationId)

  const response = await fetch(actionsUrl)
  const data: ActionsResponse = await response.json()

  return data
}

/**
 * Gathers displays and associated time series requests for filters and a location.
 *
 * The results for all filters are merged.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterIds FilterIds to get displays and request for.
 * @param locationId LocationId to get displays and requests for.
 * @returns 2-tuple with the displays and associated time series requests for all filters.
 */
export async function fetchTimeSeriesDisplaysAndRequests(
  provider: PiWebserviceProvider, filterIds: string[], locationId: string
): Promise<[DisplayConfig[], ActionRequest[]]> {
  let displays: DisplayConfig[] = []
  let requests: ActionRequest[] = []
  for (const filterId of filterIds) {
    const [displaysCur, requestsCur] = await fetchTimeSeriesDisplaysAndRequestsForSingleFilterId(
      provider, filterId, locationId
    )
    displays = displays.concat(displaysCur)
    requests = requests.concat(requestsCur)
  }
  return [displays, requests]
}

/**
 * Gathers displays and associated time series requests for a single filter and location.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterIds FilterIds to get displays and request for.
 * @param locationId LocationId to get displays and requests for.
 * @returns 2-tuple with the displays and associated time series requests.
 */
async function fetchTimeSeriesDisplaysAndRequestsForSingleFilterId(
  provider: PiWebserviceProvider, filterId: string, locationId: string
): Promise<[DisplayConfig[], ActionRequest[]]> {
  const response = await getFilterActions(provider, filterId, locationId)

  let displays: DisplayConfig[] = []
  let requests: ActionRequest[] = []
  for (const result of response.results) {
    if (!result.config) continue

    // Get configurations for each display, convert FEWS display configuration to
    // fews-web-oc-charts configuration.
    const title = result.config.timeSeriesDisplay.title ?? ''
    const displayCur = result.config.timeSeriesDisplay.subplots?.map(
      (subplot, index) => {
        return {
          id: `${title}-${index}`,
          types: [DisplayType.TimeSeriesChart, DisplayType.TimeSeriesTable],
          class: 'single',
          title: title,
          config: timeSeriesDisplayToChartConfig(subplot, title)
        }
      }
    )
    displays = displays.concat(displayCur ?? [])

    // Append requests for this time series to the list.
    requests = requests.concat(result.requests)
  }

  return [displays, requests]
}
