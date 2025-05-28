import type {
  LogDisplayLogs,
  LogDisplayLogsFilter,
} from '@deltares/fews-pi-requests'
import { arrayOfAll } from '@/lib/utils/types'

export type LogLevel = LogDisplayLogs['level'] | 'CRITICAL'

export function logLevelToPiLogLevel(level: LogLevel): LogDisplayLogs['level'] {
  return level === 'CRITICAL' ? 'ERROR' : level
}

const arrayOfAllLogLevels = arrayOfAll<LogLevel>()
export const logLevels = arrayOfAllLogLevels([
  'INFO',
  'WARN',
  'ERROR',
  'CRITICAL',
])

export type ManualLogLevel = Exclude<LogLevel, 'ERROR'>

const arrayOfAllManualLogLevels = arrayOfAll<ManualLogLevel>()
export const manualLogLevels = arrayOfAllManualLogLevels([
  'INFO',
  'WARN',
  'CRITICAL',
])

const arrayOfAllLogTypes = arrayOfAll<LogType>()
export const logTypes = arrayOfAllLogTypes(['system', 'manual'])

export type LogType = NonNullable<LogDisplayLogsFilter['logType']>

export interface LogMessage extends LogDisplayLogs {
  type: LogType
}

export interface LogDisseminationStatus {
  isLoading: boolean
  error?: string
  success?: boolean
}
