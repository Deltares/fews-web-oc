import type { DeepRequired } from '@/lib/utils/types'
import type { ReportSettings as PiReportSettings } from '@deltares/fews-pi-requests'

export type ReportSettings = DeepRequired<PiReportSettings>

export const defaultReportSettings: ReportSettings = {
  downloadReport: true,
  nonCurrentReports: false,
  reportName: false,
  analysisTimes: false,
}
