import { configManager } from '@/services/application-config/'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import type {
  TimeSeriesFlag,
  TimeSeriesFlagSource,
} from '@deltares/fews-pi-requests'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'

export const flagColors = {
  // List of flagcolors for each flag. Based on the flag id.
  '0': undefined,
  '1': '#FF0000',
  '2': '#FF8000',
  '3': '#FFC800',
  '4': '#FF0000',
  '5': '#FF8000',
  '6': '#FFFF00',
  '7': '#FF8000',
  '8': '#FFC800',
  '9': '#FFFFFF',
  '10': '#FF0000',
  '11': '#FF0000',
  '12': '#FF0000',
  '13': '#FFFFFF',
} as const

export function getFlagColor(flagId: string) {
  return flagColors[flagId as keyof typeof flagColors]
}
