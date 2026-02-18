import { configManager } from '@/services/application-config/'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import type {
  TimeSeriesFlag,
  TimeSeriesFlagSource,
} from '@deltares/fews-pi-requests'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { createTransformRequestFn } from '../requests/transformRequest'

export async function loadTimeSeriesFlags(): Promise<TimeSeriesFlag[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const flagResponse = await webServiceProvider.getFlags()
  if (flagResponse.flags === undefined) return []
  return flagResponse.flags
}

export async function loadTimeSeriesFlagSources(): Promise<
  TimeSeriesFlagSource[]
> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const transformRequestFn = (request: Request) =>
    Promise.resolve(authenticationManager.transformRequestAuth(request))
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn,
  })
  const flagSourcesResponse = await webServiceProvider.getFlagSources()
  if (flagSourcesResponse.flagSources === undefined) return []
  return flagSourcesResponse.flagSources
}
