import type {
  LogDisplayDisseminationAction,
  LogDisplayLogsFilter,
  LogDisplaySystemLog,
} from '@deltares/fews-pi-requests'
import type { LogLevel, LogMessage, LogType } from './types'

export function filterLog(
  log: LogMessage,
  levels: LogLevel[],
  logTypes: LogType[],
  search: string | undefined,
) {
  switch (log.type) {
    case 'system':
      if (levels.length > 0 && !levels.includes(log.level)) return false
      break
    case 'manual':
      // In case of manual logs, ERROR is CRITICAL
      const level = log.level === 'ERROR' ? 'CRITICAL' : log.level
      if (levels.length > 0 && !levels.includes(level)) return false
      break
  }

  if (logTypes.length > 0 && !logTypes.includes(log.type)) return false

  const user = log.user?.toLowerCase()
  const eventCode = log.code?.toLowerCase()
  const text = log.text.toLowerCase()
  const searchText = search?.toLowerCase()
  const taskRunId = log.taskRunId?.toLowerCase()

  return (
    !searchText ||
    user?.includes(searchText) ||
    eventCode?.includes(searchText) ||
    text.includes(searchText) ||
    taskRunId?.includes(searchText)
  )
}

export function logToColor(log: LogMessage) {
  switch (log.level) {
    case 'INFO':
      return 'info'
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

export function levelToTitle(level: LogLevel) {
  switch (level) {
    case 'INFO':
      return 'Information'
    case 'WARN':
      return 'Warning'
    case 'ERROR':
      return 'Error'
    case 'CRITICAL':
      return 'Critical'
    default:
      return level
  }
}

export function logToIcon(log: LogMessage) {
  switch (log.level) {
    case 'INFO':
      return log.eventAcknowledged
        ? 'mdi-information-outline'
        : 'mdi-information'
    case 'WARN':
      return log.eventAcknowledged ? 'mdi-alert-outline' : 'mdi-alert'
    case 'ERROR':
      return log.eventAcknowledged
        ? 'mdi-alert-octagon-outline'
        : 'mdi-alert-octagon'
  }
}

export function levelToIcon(level: LogLevel) {
  switch (level) {
    case 'INFO':
      return 'mdi-information'
    case 'WARN':
      return 'mdi-alert'
    case 'CRITICAL':
    case 'ERROR':
      return 'mdi-alert-octagon'
  }
}

export function levelToColor(level: LogLevel) {
  switch (level) {
    case 'INFO':
      return 'info'
    case 'WARN':
      return 'warning'
    case 'CRITICAL':
    case 'ERROR':
      return 'error'
  }
}

export function logToRoute(log: LogMessage) {
  return {
    name: 'TopologyDisplay',
    params: { nodeId: log.topologyNodeId },
  }
}

export function logToUser(log: LogMessage, userName: string) {
  if (log.type === 'system') return log.code
  return isLogMessageByCurrentUser(log, userName) ? 'You' : log.user
}

export function logToUserColor(log: LogMessage, userName: string) {
  const user = logToUser(log, userName)
  return nameToNiceColor(user ?? '')
}

export function isLogMessageByCurrentUser(log: LogMessage, userName: string) {
  if (log.type === 'system') return false
  return log.user === userName
}

export function logToActions(
  log: LogMessage,
  disseminationActions: LogDisplayDisseminationAction[],
) {
  const actions = disseminationActions.filter((action) => {
    if (action.manualLog && log.type === 'manual') return true
    if (action.systemLog && log.type === 'system') return true
    return false
  })

  return actions
}

export function getManualFilters(
  baseFilter: LogDisplayLogsFilter,
  eventCode: string,
): LogDisplayLogsFilter[] {
  return [
    {
      ...baseFilter,
      logType: 'manual',
      level: 'INFO',
      eventCode: eventCode,
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

const niceColors = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#7986CB',
  '#64B5F6',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#AED581',
  '#FF8A65',
  '#D4E157',
  '#FFEE58',
  '#FFCA28',
  '#FFA726',
  '#FF7043',
  '#8D6E63',
  '#BDBDBD',
  '#78909C',
  '#FF5252',
  '#E040FB',
  '#7C4DFF',
  '#536DFE',
  '#448AFF',
  '#40C4FF',
  '#18FFFF',
  '#69F0AE',
  '#00E676',
  '#76FF03',
  '#C6FF00',
  '#FFEA00',
  '#FFC400',
  '#FF9100',
  '#FF3D00',
  '#DD2C00',
  '#3E2723',
  '#212121',
  '#263238',
  '#00BFA5',
  '#1DE9B6',
  '#00E5FF',
  '#2979FF',
  '#651FFF',
  '#D500F9',
  '#C51162',
  '#AA00FF',
  '#6200EA',
  '#2962FF',
  '#304FFE',
  '#0091EA',
]

function nameToNiceColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  let index = Math.abs(hash) % niceColors.length
  return niceColors[index]
}

export function getLogDisseminationKey(
  log: LogMessage,
  dissemination: LogDisplayDisseminationAction,
) {
  return `${log.taskRunId}-${log.entryTime}-${log.text.length}-${dissemination.id}`
}
