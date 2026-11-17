export type StatusSource = 'import' | 'export'

export type StatusSourceFilter = 'both' | StatusSource

export type StatusResultFilter = 'successful' | 'unsuccessful'

export interface ImportExportStatusItem {
  mcId: string
  taskRunId?: string
  workflowId?: string
  workflowName?: string
  directory: string
  suspended?: boolean
  dataFeed: string
  dataFeedName?: string
  dataFeedDescription?: string
  lastSuccessfulTime?: string
  lastSuccessfulFile: string
  filesSuccessfulCount: number
  filesFailedCount: number
  lastSuccessfulTimeBackgroundColor?: string
  status?: string
  statusType: StatusSource
}
