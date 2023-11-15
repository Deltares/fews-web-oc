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
  let elevationResponse: ActionsResponse | null = null
  let hasElevation = false
  if (isFilterActionsFilter(filter)) {
    response = await provider.getFilterActions(filter)
  } else if (isTimeSeriesGridActionsFilter(filter)) {
    response = await provider.getTimeSeriesGridActions(filter)
    hasElevation = filter.elevation !== undefined
    if (hasElevation) {
      elevationResponse = await provider.getTimeSeriesGridActions({
        ...filter,
        showVerticalProfile: true,
        elevation: undefined
      })
      for (const result of elevationResponse.results) {
        result.requests.forEach((request) => {
          if (request.key === undefined) {
            request.key = `${request.request}`
          }
        })
      }
    }
  } else {
    throw new Error('Filter type not supported')
  }

  let displays: DisplayConfig[] = []
  let requests: ActionRequest[] = []
  for (const [responseIndex, result] of response.results.entries()) {
    result.requests.forEach((request) => {
      if (request.key === undefined) {
        request.key = `${request.request}`
      }
    })
    if (!result.config) continue
    const elevationResult = elevationResponse?.results[responseIndex]

    // Get configurations for each display, convert FEWS display configuration to
    // fews-web-oc-charts configuration.
    const title = result.config.timeSeriesDisplay.title ?? ''

    let displayTypes = [DisplayType.TimeSeriesChart, DisplayType.TimeSeriesTable]
    if (hasElevation) {
      displayTypes = [...displayTypes, DisplayType.ElevationChart]
    }

    // for add a sequence number to the subplot items. Where the sequence number is counted first by items and then by subplots.
    // e.g. subplot 1 has 2 items, subplot 2 has 2 items. Then the sequence numbers are:
    // subplot 1 item 1: 0
    // subplot 1 item 2: 2
    // subplot 2 item 1: 1
    // subplot 2 item 2: 3
    const addSequence = (result.config.timeSeriesDisplay.subplots?.length ?? 0) > result.requests.length ||
      result.config.timeSeriesDisplay.subplots?.some((subplot) => subplot.items.length > result.requests.length)

    result.config.timeSeriesDisplay.subplots?.forEach((subplot, subplotIndex) => {
      subplot.items.forEach((item, itemIndex) => {
        if (addSequence) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          item.sequence = subplotIndex + itemIndex * result.config.timeSeriesDisplay.subplots.length
        }
      })
    })

    const addSequenceElevation = (elevationResult?.config?.timeSeriesDisplay.subplots?.length ?? 0) > result.requests.length ||
      elevationResult?.config?.timeSeriesDisplay.subplots?.some((subplot) => subplot.items.length > result.requests.length)

    elevationResult?.config?.timeSeriesDisplay.subplots?.forEach((subplot, subplotIndex) => {
      subplot.items.forEach((item, itemIndex) => {
        if (addSequenceElevation) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          item.sequence = subplotIndex + itemIndex * elevationResult.config.timeSeriesDisplay.subplots.length
        }
      })
    })

    const displayCur = result.config.timeSeriesDisplay.subplots?.map(
      (subplot, subplotIndex) => {
        for (const item of subplot.items) {
          item.request ??= result.requests[0].request;
        }
        const timeSeriesConfig = timeSeriesDisplayToChartConfig(subplot, title)
        let config = Array(2).fill(timeSeriesConfig)

        if (hasElevation) {
          const elevationSubplot = elevationResult?.config?.timeSeriesDisplay.subplots?.[subplotIndex]
          if (elevationSubplot !== undefined) {
            for (const item of elevationSubplot.items) {
              item.request ??= elevationResult?.requests[0].request
            }
            const elevationConfig = timeSeriesDisplayToChartConfig(elevationSubplot, title)
            config = [elevationConfig, ...config]
          }
        }

        return {
          id: `${title}-${subplotIndex}-${hasElevation}`,
          types: displayTypes,
          class: 'single',
          title: title,
          config: config
        }
      }
    )
    displays = displays.concat(displayCur ?? [])

    // Append requests for this time series to the list.
    requests = requests.concat(result.requests)
  }

  if (elevationResponse !== null) {
    for (const result of elevationResponse.results) {
      requests = requests.concat(result.requests)
    }
  }

  return [displays, requests]
}
