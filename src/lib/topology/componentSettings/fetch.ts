import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  type WebOCComponentSettings,
  type ComponentSettingsFilter,
  PiWebserviceProvider,
} from '@deltares/fews-pi-requests'

export async function fetchComponentSettings(
  baseUrl: string,
  componentSettingsId: string,
): Promise<WebOCComponentSettings | undefined> {
  const provider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const filter: ComponentSettingsFilter = {
    componentSettingsId,
  }
  try {
    console.log('Fetching component settings')
    const response = await provider.getComponentSettings(filter)
    return response?.webOCComponentSettings
  } catch (error) {
    console.error('Failed to fetch component settings', error)
  }
}
