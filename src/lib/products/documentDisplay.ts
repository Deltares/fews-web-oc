import { type TimeSettingsViewPeriodPreset } from "@deltares/fews-pi-requests"

export interface DocumentDisplaysConfig {
  documentDisplays: (DocumentBrowserDisplay | ReportDisplay)[]
}

export interface DocumentBrowserDisplay {
  id: string
  name: string
  type: 'browser'
  relativeViewPeriod: Omit<TimeSettingsViewPeriodPreset,'label'>
  documentBrowser: DocumentBrowser
}

export interface ReportDisplay {
  id: string
  name: string
  type: 'report'
  relativeViewPeriod: Omit<TimeSettingsViewPeriodPreset,'label'>
  reportDisplay: ReportDisplayConfig
}

export interface DocumentBrowser {
  layout: Layout
  reports: Reports
  archiveProducts: ArchiveProducts
  archiveProductSet: ArchiveProductSet
}

export interface ArchiveProductSet {
  contstraints: Contstraints
}

export interface Contstraints {
  areaId: string
  sourceId: string
  attributeExists: AttributeExists
}

export interface AttributeExists {
  id: string
}

export interface ArchiveProducts {
  archiveProductId: string[]
}

export interface Layout {
  preview: string | boolean
  headers: (AttributeHeader | PropertyHeader)[]
}

interface AttributeHeader {
  attribute: string
  title: string
}

interface PropertyHeader {
  property: string
  title: string
}

export interface Reports {
  reportModuleInstanceId: string[]
}

export interface ReportDisplayConfig {
  archiveProductId?: string
  showReports: ShowReports
  reportModuleInstanceId?: string
}

export interface ShowReports {
  productWorkflowStatusId?: string
}

export function isDocumentBrowser(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay,
): documentDisplay is DocumentBrowserDisplay {
  return (
    (documentDisplay as DocumentBrowserDisplay).type === 'browser'
  )
}
