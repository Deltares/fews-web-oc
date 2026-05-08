import {
  type DocumentFormat,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type Filter,
  isCorrelationFilter,
  isFilterActionsFilter,
  isTimeSeriesGridActionsFilter,
  isTimeSeriesTopologyActionsFilter,
} from '@/lib/filters'

export function getDownloadFileUrl(
  baseUrl: string,
  filter: Filter,
  downloadFormat: DocumentFormat,
  viewPeriod: { startTime?: string; endTime?: string },
): URL {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  if (isFilterActionsFilter(filter)) {
    return piProvider.timeSeriesFilterActionsUrl({
      ...filter,
      documentFormat: downloadFormat,
      ...viewPeriod,
    })
  }

  if (isTimeSeriesGridActionsFilter(filter)) {
    return piProvider.timeSeriesGridUrl({
      ...filter,
      documentFormat: downloadFormat,
      ...viewPeriod,
    })
  }

  if (isCorrelationFilter(filter)) {
    return piProvider.correlationUrl({
      ...filter,
      ...viewPeriod,
    })
  }

  if (isTimeSeriesTopologyActionsFilter(filter)) {
    return piProvider.timeSeriesTopologyActionsUrl({
      ...filter,
      documentFormat: downloadFormat,
      ...viewPeriod,
    })
  }

  return piProvider.timeSeriesUrl({
    ...filter,
    documentFormat: downloadFormat,
    ...viewPeriod,
  })
}
