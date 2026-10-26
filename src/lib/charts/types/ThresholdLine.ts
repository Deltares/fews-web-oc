export interface ThresholdLine {
  id: string
  x1: Date
  x2: Date
  value: number
  description: string
  labelPosition?: 'left' | 'right'
  yAxisIndex: number
  color: string
}
