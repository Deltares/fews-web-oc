import type {
  LogDisplayLogsFilter,
  LogDisplayManualLog,
  LogDisplaySystemLog,
} from '@deltares/fews-pi-requests'
import type { LogLevel, LogMessage, LogType } from './types'

export function filterLog(
  log: LogMessage,
  users: string[],
  levels: LogLevel[],
  eventCodes: string[],
  logTypes: LogType[],
  search: string | undefined,
) {
  if (users.length > 0 && !users.includes(log.user ?? 'invalid-user')) {
    return false
  }
  if (levels.length > 0 && !levels.includes(log.level)) return false
  if (eventCodes.length > 0 && !eventCodes.includes(log.code)) return false
  if (logTypes.length > 0 && !logTypes.includes(log.type)) return false
  if (search && !log.text.toLowerCase().includes(search.toLowerCase())) {
    return false
  }
  return true
}

export function logToColor(log: LogMessage, userName: string) {
  switch (log.level) {
    case 'INFO':
      return isLogMessageByCurrentUser(log, userName) ? 'info' : 'surface'
    case 'WARN':
      return 'warning'
    case 'ERROR':
      return 'red-darken-4'
  }
}

export function logToUserIcon(log: LogMessage) {
  switch (log.type) {
    case 'system':
      return 'mdi-robot'
    case 'manual':
      return 'mdi-account'
  }
}

export function logToIcon(log: LogMessage) {
  switch (log.level) {
    case 'INFO':
      return '$info'
    case 'WARN':
      return '$warning'
    case 'ERROR':
      return '$error'
  }
}

export function logToRoute(log: LogMessage) {
  return {
    name: 'TopologyDisplay',
    params: { nodeId: log.topologyNodeId },
  }
}

export function logToUser(log: LogMessage, userName: string) {
  if (log.type === 'system') return 'System'
  return isLogMessageByCurrentUser(log, userName) ? 'You' : log.user
}

export function isLogMessageByCurrentUser(log: LogMessage, userName: string) {
  if (log.type === 'system') return false
  return log.user === userName
}

export function getManualFilters(
  baseFilter: LogDisplayLogsFilter,
  settings: LogDisplayManualLog,
): LogDisplayLogsFilter[] {
  return [
    {
      ...baseFilter,
      logType: 'manual',
      level: 'INFO',
      eventCode: `Manual.event.${settings.noteGroupId}`,
    },
  ]
}

export function getSystemFilters(
  baseFilter: LogDisplayLogsFilter,
  settings: LogDisplaySystemLog,
): LogDisplayLogsFilter[] {
  const logLevelFilter: LogDisplayLogsFilter = {
    ...baseFilter,
    logType: 'system',
    level: settings.logLevel,
  }
  const codeFilters: LogDisplayLogsFilter[] =
    settings.eventCodes?.map((eventCode) => ({
      ...baseFilter,
      logType: 'system',
      eventCode,
    })) ?? []

  if (logLevelFilter.level) {
    return [logLevelFilter, ...codeFilters]
  } else {
    return codeFilters
  }
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  )
}
