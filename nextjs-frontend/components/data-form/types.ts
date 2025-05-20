import { FinancialRow } from "./schema/financial-report"
import { ReportTitleProps } from "./title-section"

// Type for selection options
export interface SelectionOption {
  value: string
  label: string
}

// Type for selection handlers
export interface SelectionHandlers {
  onHealthCenterChange?: (value: string) => void
  onReportingPeriodChange?: (value: string) => void
}

// Extended interface that includes both table data and metadata
export interface FinancialReportData {
  tableData: FinancialRow[]
  metadata: {
    healthCenter?: string
    district?: string
    project?: string
    reportingPeriod?: string
    fiscalYear?: string
  }
}

// Props for FinancialTable component
export interface FinancialTableProps {
  data?: FinancialRow[]
  fiscalYear?: string
  onSave?: (data: FinancialReportData) => void
  readOnly?: boolean
  expandedRowIds?: string[]
  reportMetadata?: ReportTitleProps
  // Selection props
  healthCenters?: SelectionOption[]
  reportingPeriods?: SelectionOption[]
  selectedHealthCenter?: string
  selectedReportingPeriod?: string
  isHospitalMode?: boolean
  onHealthCenterChange?: (value: string) => void
  onReportingPeriodChange?: (value: string) => void
}

// Helper component for rendering numeric input cells
export interface NumericInputCellProps {
  rowId: string
  field: string
  value: number | undefined
  readOnly: boolean
  label: string
} 