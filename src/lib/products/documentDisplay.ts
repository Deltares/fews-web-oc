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
  browser: DocumentBrowser
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
  archiveProducts: ArchiveProduct[]
  archiveProductSets: ArchiveProductSet[]
}

export interface ArchiveProductSet {
  constraints: Constraints
}

export interface Constraints {
  areaId: string
  sourceId: string
  attributeExists?: AttributeExists
  allValid?: AttributeEquals[]
  anyValid?: AttributeEquals[]
}

export interface AttributeExists {
  id: string
}

export interface AttributeEquals {
  attributeTextEquals: {
    id: string
    equals: string
  }
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
  headers: (AttributeHeaderFews | PropertyHeaderFews)[]
}

interface AttributeHeaderFews {
  name: string
  productAttribute: string
}

interface PropertyHeaderFews {
  name: string
  productProperty: string
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
