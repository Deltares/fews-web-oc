import { ActionsResponse, ActionRequest, PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { DisplayType, DisplayConfig } from "@/lib/Layout/DisplayConfig";
import { timeSeriesDisplayToChartConfig } from "@/lib/ChartConfig/timeSeriesDisplayToChartConfig";

// TODO: Remove once this has been implemented in fews-pi-requests.
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
