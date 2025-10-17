import type {
  DocumentDisplayArchiveProduct,
  DocumentDisplayReport,
  DocumentDisplayReportType,
  DocumentDisplayArchiveProductSet,
  ArchiveProductSetConstraints,
  DocumentDisplayCompose,
  DocumentDisplayBrowser,
} from '@deltares/fews-pi-requests'

export interface DocumentDisplaysConfig {
  documentDisplays: (DocumentBrowserDisplay | ReportDisplay | DisplayCompose)[]
}

export interface DocumentBrowserDisplay
  extends Omit<DocumentDisplayBrowser, 'type' | 'browser'> {
  type: 'browser'
  browser: DocumentBrowser
}

export interface ReportDisplay extends Omit<DocumentDisplayReport, 'type'> {
  type: 'report'
  report: ReportDisplayConfig
}

export interface DisplayCompose extends Omit<DocumentDisplayCompose, 'type'> {
  type: 'compose'
}

export interface DocumentBrowser {
  layout: Layout
  reports: Reports
  archiveProducts: ArchiveProduct[]
  archiveProductSets: ArchiveProductSet[]
}

export interface ArchiveProductSet
  extends Omit<DocumentDisplayArchiveProductSet, 'constraints'> {
  constraints: Constraints
}

export interface Constraints extends ArchiveProductSetConstraints {
  attributeExists?: AttributeExists
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

export interface ArchiveProduct extends DocumentDisplayArchiveProduct {
  description: string
  timeZero: string
  version: string
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

export interface ReportDisplayConfig
  extends Omit<DocumentDisplayReportType, 'archiveProduct'> {
  archiveProduct: ArchiveProduct
}

export interface ShowReports {
  productWorkflowStatusId?: string
}

export function isDocumentBrowser(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay | DisplayCompose,
): documentDisplay is DocumentBrowserDisplay {
  return (documentDisplay as DocumentBrowserDisplay).type === 'browser'
}

export function isReportDisplay(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay | DisplayCompose,
): documentDisplay is ReportDisplay {
  return (documentDisplay as ReportDisplay).type === 'report'
}

export function isDisplayCompose(
  documentDisplay: DocumentBrowserDisplay | ReportDisplay | DisplayCompose,
): documentDisplay is DisplayCompose {
  return (documentDisplay as DisplayCompose).type === 'compose'
}
