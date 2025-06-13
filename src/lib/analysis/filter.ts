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

export async function createNewChartsForFilters(
  filters: filterActionsFilter[],
) {
  const promises = filters.map(createNewChartForFilter)
  const charts = await Promise.all(promises)
  return charts.filter((chart) => chart !== undefined)
}

export async function createNewChartForFilter(filter: filterActionsFilter) {
  const actions = await fetchActions(baseUrl, filter)

  const colorsStore = useTaskRunColorsStore()
  replaceDuplicateColors(actions, colorsStore.colors)

  const result = actions.results[0]
  const display = result.config?.timeSeriesDisplay

  const subplot = display?.subplots?.[0]
  if (!subplot) return

  const newRequests = result.requests.filter(
    (req, i, s) => i === s.findIndex((r) => r.key === req.key),
  )

  const requests = getActionRequestsForSubplot(subplot, newRequests)

  const newCharts: FilterChart = {
    id: crypto.randomUUID(),
    type: 'filter',
    title: 'New Chart',
    filters: { left: filter },
    subplot,
    requests,
  }
  return newCharts
}

export async function getFilterChartTitle(chart: FilterChart) {
  const newHeaders = await fetchTimeSeriesHeaders(baseUrl, chart.requests, {})

  const locationIds = chart.subplot.items
    .flatMap((item) => item.locationId ?? [])
    .filter((value, index, self) => self.indexOf(value) === index)

  const locations = await fetchLocations(baseUrl, {
    locationIds,
  })
  const headers = chart.requests.flatMap((req) => newHeaders[req.key ?? ''])
  return getTitleFromHeaders(headers, locations)
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

export async function addFilterToChart(
  chart: FilterChart,
  filter: filterActionsFilter,
) {
  const parametersStore = useParametersStore()

  const filterParameter = filter.parameterIds?.split(',')[0]
  const filterParameterGroup =
    parametersStore.byId(filterParameter)?.parameterGroup
  if (!filterParameterGroup)
    throw new Error('No parameter group found for filter')

  const leftParameter = chart.filters.left.parameterIds?.split(',')[0]
  const leftParameterGroup = parametersStore.byId(leftParameter)?.parameterGroup
  if (!leftParameterGroup)
    throw new Error('No parameter group found for left filter')

  const rightParameter = chart.filters.right?.parameterIds?.split(',')[0]
  const rightParameterGroup =
    parametersStore.byId(rightParameter)?.parameterGroup

  const addToLeft = filterParameterGroup === leftParameterGroup
  const addToRight = filterParameterGroup === rightParameterGroup
  const addRight = rightParameterGroup === undefined

  if (!addToLeft && !addToRight && !addRight)
    throw new Error('Filter parameter group does not match any chart filter')

  if (addToLeft) {
    await addFilterToChartPosition(
      chart,
      combineFilters(filter, chart.filters.left),
      'left',
    )
  } else if (addToRight && chart.filters.right) {
    await addFilterToChartPosition(
      chart,
      combineFilters(filter, chart.filters.right),
      'right',
    )
  } else if (addRight) {
    await addFilterToChartPosition(chart, filter, 'right')
  }
}

function combineFilters(
  filter: filterActionsFilter,
  chartFilter: filterActionsFilter,
): filterActionsFilter {
  console.log(filter, chartFilter)
  return {
    ...filter,
    locationIds: [
      ...(filter.locationIds?.split(',') ?? []),
      ...(chartFilter.locationIds?.split(',') ?? []),
    ]
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(','),
    parameterIds: [
      ...(filter.parameterIds?.split(',') ?? []),
      ...(chartFilter.parameterIds?.split(',') ?? []),
    ]
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(','),
    // @ts-ignore
    moduleInstanceIds: [
      // @ts-ignore
      ...(filter.moduleInstanceIds?.split(',') ?? []),
      // @ts-ignore
      ...(chartFilter.moduleInstanceIds?.split(',') ?? []),
    ]
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(','),
  }
}

async function addFilterToChartPosition(
  chart: FilterChart,
  filter: filterActionsFilter,
  position: 'left' | 'right',
) {
  const newChart = await createNewChartForFilter(filter)

  if (!newChart) return

  newChart.subplot.items.forEach((item) => {
    item.yAxis = {
      ...item.yAxis,
      axisPosition: position,
    }
  })

  if (position === 'left') {
    chart.filters.left = filter
  } else if (position === 'right') {
    chart.filters.right = filter
  }

  const newItems = [...chart.subplot.items, ...newChart.subplot.items]
  chart.subplot.items = newItems.filter(
    (item, index, self) =>
      index === self.findIndex((i) => i.request === item.request),
  )

  const newRequests = [...chart.requests, ...newChart.requests]
  chart.requests = newRequests.filter(
    (request, index, self) =>
      index === self.findIndex((r) => r.request === request.request),
  )

  chart.title = await getFilterChartTitle(chart)
}
