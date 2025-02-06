import type {
  LogDisplayLogs,
  LogDisplayLogsFilter,
} from '@deltares/fews-pi-requests'
import { arrayOfAll } from '@/lib/utils/types'

export type LogLevel = LogDisplayLogs['level']

const arrayOfAllLogLevels = arrayOfAll<LogLevel>()
export const logLevels = arrayOfAllLogLevels(['INFO', 'WARN', 'ERROR'])

const arrayOfAllLogTypes = arrayOfAll<LogType>()
export const logTypes = arrayOfAllLogTypes(['system', 'manual'])

export type LogType = NonNullable<LogDisplayLogsFilter['logType']>

export interface LogMessage extends LogDisplayLogs {
  type: LogType
}
