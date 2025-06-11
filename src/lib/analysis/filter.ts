import { fetchActions } from '@/services/useDisplayConfig'
import { fetchTimeSeriesHeaders } from '@/services/useTimeSeries'
import { useParametersStore } from '@/stores/parameters'
import {
  ActionRequest,
  filterActionsFilter,
  Header,
  Location,
  TimeSeriesDisplaySubplot,
} from '@deltares/fews-pi-requests'
import { fetchLocations } from '@/lib/topology/locations'
import { FilterChart } from './types'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { replaceDuplicateColors } from '@/lib/display'
import { configManager } from '@/services/application-config'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

export async function createNewChartsForFilter(
  filter: filterActionsFilter,
  titlePrefix?: string,
) {
  const actions = await fetchActions(baseUrl, filter)

  const colorsStore = useTaskRunColorsStore()
  replaceDuplicateColors(actions, colorsStore.colors)

  const results = actions.results

  const newSubplots = results.flatMap(
    (result) => result.config?.timeSeriesDisplay.subplots ?? [],
  )
  const newRequests = results
    .flatMap((result) => result.requests)
    .filter((req, i, s) => i === s.findIndex((r) => r.key === req.key))

  const newHeaders = await fetchTimeSeriesHeaders(baseUrl, newRequests, {})

  const locationIds = newSubplots
    .flatMap((subPlot) =>
      subPlot.items.flatMap((item) => item.locationId ?? []),
    )
    .filter((value, index, self) => self.indexOf(value) === index)

  const locations = await fetchLocations(baseUrl, {
    locationIds,
  })

  const newCharts: FilterChart[] = newSubplots.map((subPlot) => {
    const requests = getActionRequestsForSubplot(subPlot, newRequests)
    const headers = requests.flatMap((req) => newHeaders[req.key ?? ''])
    const title = getTitleFromHeaders(headers, locations)
    return {
      id: crypto.randomUUID(),
      type: 'filter',
      title: titlePrefix ? `${titlePrefix}${title}` : title,
      subplot: subPlot,
      requests: requests,
    }
  })
  return newCharts
}

function getTitleFromHeaders(headers: Header[], locations: Location[]) {
  const parametersStore = useParametersStore()

  const uniqueParameters = headers
    .map((header) => header.parameterId)
    .filter((value, index, self) => self.indexOf(value) === index)

  const uniqueParameterGroups = uniqueParameters
    .map(parametersStore.getGroupName)
    .filter((value, index, self) => self.indexOf(value) === index)

  const uniqueLocations = headers
    .map((header) => header.locationId)
    .filter((value, index, self) => self.indexOf(value) === index)

  const getLocationName = (locationId: string) => {
    const location = locations.find(
      (location) => location.locationId === locationId,
    )
    return location?.locationName ?? location?.shortName ?? locationId
  }

  const uniqueLocationNames = uniqueLocations
    .map(getLocationName)
    .filter((value, index, self) => self.indexOf(value) === index)

  const format = (items: string[]) => {
    const displayed = items.slice(0, 2).join(', ')
    const extra = items.length > 2 ? `, +${items.length - 2} more` : ''
    return displayed + extra
  }

  return `${format(uniqueParameterGroups)} at ${format(uniqueLocationNames)}`
}

function getActionRequestsForSubplot(
  subplot: TimeSeriesDisplaySubplot,
  requests: ActionRequest[],
) {
  return subplot.items.flatMap(
    (item) => requests.find((req) => req.key === item.request) ?? [],
  )
}
