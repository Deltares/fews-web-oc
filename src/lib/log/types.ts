export const LogLevelEnum = {
  Info: 'Info',
  Warning: 'Warning',
  Error: 'Error',
} as const

export type LogLevelType = (typeof LogLevelEnum)[keyof typeof LogLevelEnum]

export enum LogType {
  System = 'System',
  Manual = 'Manual',
}

export interface GeneralLogMessage {
  level: LogLevelType
  message: string
  creationTime: Date
  eventCode: string
  logType: LogType
}

export interface ManualLogMessage extends GeneralLogMessage {
  logType: LogType.Manual
  user: string
  topologyNodeId?: string
}

export interface SystemLogMessage extends GeneralLogMessage {
  logType: LogType.System
  workflow: string
}

export type LogMessage = Pick<GeneralLogMessage, 'logType'> &
  Omit<ManualLogMessage, 'logType'> &
  Omit<SystemLogMessage, 'logType'>
