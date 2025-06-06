import type { CorrelationFilter } from '@deltares/fews-pi-requests'
import { arrayOfAll } from '@/lib/utils/types'

export type RegressionEquation = {
  label: string
  value: CorrelationFilter['regressionEquation']
}

const arrayOfAllRegressionEquations = arrayOfAll<RegressionEquation>()
export const regressionEquations = arrayOfAllRegressionEquations([
  { label: 'Simple linear', value: 'simple linear' },
  { label: 'Multiple linear', value: 'multiple linear' },
  { label: 'Logarithmic', value: 'logarithmic' },
  { label: 'Hyperbolic', value: 'hyperbolic' },
  { label: 'Power', value: 'power' },
  { label: 'Exponential multiply', value: 'exponential multiply' },
])
