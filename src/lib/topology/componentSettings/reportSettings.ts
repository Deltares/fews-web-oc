import type { DeepRequired } from '@/lib/utils/types'
import type { ReportSettings } from '@deltares/fews-pi-requests'

export const defaultReportSettings: DeepRequired<ReportSettings> = {
  downloadReport: true,
  hideNonCurrentReports: false,
  hideReportName: false,
  hideAnalysisTime: false,
}
