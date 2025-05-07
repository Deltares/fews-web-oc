import { LogDisplayDisseminationAction } from '@deltares/fews-pi-requests'
import { LogMessage } from './types'

export interface LogActionEmit {
  disseminateLog: [
    log: LogMessage,
    dissemination: LogDisplayDisseminationAction,
  ]
  deleteLog: [log: LogMessage]
  editLog: [log: LogMessage]
}
