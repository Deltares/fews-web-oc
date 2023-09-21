import { ActionsResponse, ActionRequest, PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { DisplayType, DisplayConfig } from "@/lib/Layout/DisplayConfig";
import { timeSeriesDisplayToChartConfig } from "@/lib/ChartConfig/timeSeriesDisplayToChartConfig";
import { timeSeriesGridActionsFilter, filterActionsFilter } from "@deltares/fews-pi-requests";

type FilterArray = (timeSeriesGridActionsFilter | filterActionsFilter)[];
// guard fuctions, needed because is not possible to use instanceof/ typeof on interfaces
function isFilterActionsFilter(filter: timeSeriesGridActionsFilter | filterActionsFilter): filter is filterActionsFilter {
  return (filter as filterActionsFilter).filterId !== undefined;
}

function isTimeSeriesGridActionsFilter(filter: timeSeriesGridActionsFilter | filterActionsFilter): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter).x !== undefined;
}

/**
 * Gathers displays and associated time series requests for filters and a location.
 *
 * The results for all filters are merged.
 *
 * @param provider FEWS PI Webservices provider.
 * @param filterIds FilterIds to get displays and request for.
 * @param locationId LocationId to get displays and requests for.
 * @param coordinates Coordinates to get displays and requests for. 
 * @returns 2-tuple with the displays and associated time series requests for all filters.
 */
export async function fetchTimeSeriesDisplaysAndRequests(
  provider: PiWebserviceProvider, filters: FilterArray): Promise<[DisplayConfig[], ActionRequest[]]> {
  let displays: DisplayConfig[] = []
  let requests: ActionRequest[] = []
  for (const filter of filters) {
      const [displaysCur, requestsCur] = await fetchTimeSeriesDisplaysAndRequestsForSingleFilter(
        provider, filter
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
 * @param coordinates Coordinates to get displays and requests for.
 * @returns 2-tuple with the displays and associated time series requests.
 */
async function fetchTimeSeriesDisplaysAndRequestsForSingleFilter(
  provider: PiWebserviceProvider, filter: timeSeriesGridActionsFilter | filterActionsFilter
): Promise<[DisplayConfig[], ActionRequest[]]> {

  let response: ActionsResponse | null = null

  if (isFilterActionsFilter(filter)) {
    response = await provider.getFilterActions(filter)
  } else if (isTimeSeriesGridActionsFilter(filter)) {
    response = await provider.getTimeSeriesGridActions(filter)
  } else {
    throw new Error('Filter type not supported')
  }

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
