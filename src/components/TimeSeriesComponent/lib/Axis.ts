export interface Axis {
  type: string;
  location: string;
  label?: string;
  unit?: string;
  includeZero?: boolean
  domain?: number[] | Date[]
}
