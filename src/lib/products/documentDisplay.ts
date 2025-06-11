import {
  ArchiveProductsMetadataAttribute,
  type TimeSettingsViewPeriodPreset,
} from '@deltares/fews-pi-requests'

export interface DocumentDisplaysConfig {
  documentDisplays: (DocumentBrowserDisplay | ReportDisplay)[]
}

export interface DocumentBrowserDisplay {
  id: string
  name: string
  type: 'browser'
  relativeViewPeriod: Omit<TimeSettingsViewPeriodPreset, 'label'>
  editPermissions?: boolean
  documentBrowser: DocumentBrowser
}

export interface ReportDisplay {
  id: string
  name: string
  type: 'report'
  relativeViewPeriod: Omit<TimeSettingsViewPeriodPreset, 'label'>
  editPermissions?: boolean
  report: ReportDisplayConfig
}

export interface DocumentBrowser {
  layout: Layout
  reports: Reports
  archiveProducts: ArchiveProducts
  archiveProductSet: ArchiveProductSet
}

export interface ArchiveProductSet {
  constraints: Constraints
}

export interface Constraints {
  areaId: string
  sourceId: string
  attributeExists: AttributeExists
}

export interface AttributeExists {
  id: string
}

export interface ArchiveProduct {
  id: string
  name: string
  description: string
  sourceId: string
  areaId: string
  timeZero: string
  version: string
  versionKeys: string[]
  attributes: ArchiveProductsMetadataAttribute[]
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
  archiveProduct: ArchiveProduct
  showReports: ShowReports
  reportModuleInstanceId?: string
}

export interface ShowReports {
  productWorkflowStatusId?: string
}

export function isDocumentBrowser(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay,
): documentDisplay is DocumentBrowserDisplay {
  return (documentDisplay as DocumentBrowserDisplay).type === 'browser'
}

export function isReportDisplay(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay,
): documentDisplay is ReportDisplay {
  return (documentDisplay as ReportDisplay).type === 'report'
}
