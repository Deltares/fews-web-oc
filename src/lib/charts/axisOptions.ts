import {
  type CartesianAxesOptions,
  AxisPosition,
  AxisType,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import { merge } from 'lodash-es'

function getDefaultMargin() {
  return {
    top: 25,
    left: 50,
    right: 50,
    bottom: 40,
  }
}

function getDefaultOptions(): CartesianAxesOptions {
  return {
    x: [
      {
        type: AxisType.time,
        position: AxisPosition.Bottom,
        showGrid: true,
        labelOffset: 7,
      },
    ],
    y: [
      {
        position: AxisPosition.Left,
        showGrid: true,
        label: ' ',
        unit: ' ',
        nice: true,
      },
      {
        position: AxisPosition.Right,
        label: ' ',
        unit: ' ',
        nice: true,
      },
    ],
    margin: getDefaultMargin(),
    automargin: true,
  }
}

function getVerticalProfileOptions(): Partial<CartesianAxesOptions> {
  return {
    margin: {
      left: 70,
      right: 30,
    },
  }
}

function getNoYLabelOptions(): Partial<CartesianAxesOptions> {
  return {
    y: [
      {
        label: '',
      },
      {
        label: '',
      },
    ],
    margin: {
      top: 20,
    },
  }
}

function getNoXLabelOptions(): Partial<CartesianAxesOptions> {
  return {
    x: [
      {
        label: '',
      },
      {
        label: '',
      },
    ],
  }
}

function getLegendBelowChartOptions(): Partial<CartesianAxesOptions> {
  return {
    margin: {
      top: 40,
      bottom: 25,
    },
  }
}

function getBrushOptions(): Partial<CartesianAxesOptions> {
  return {
    margin: { top: 5 },
    x: [
      {
        showAxis: false,
        showGrid: false,
      },
    ],
    y: [
      { showAxis: false, showGrid: false, label: '', unit: '' },
      { showAxis: false, showGrid: false, label: '', unit: '' },
    ],
  }
}

export function getAxisOptions(
  config: ChartConfig,
  settings:
    | ChartsSettings['timeSeriesChart']
    | ChartsSettings['verticalProfileChart'],
  options?: {
    isVerticalProfile?: boolean
    isBrush?: boolean
  },
): CartesianAxesOptions {
  const configOptions: Partial<CartesianAxesOptions> = {
    x: config?.xAxis,
    y: config?.yAxis,
  }

  const extraOptions = [configOptions]

  if (options?.isVerticalProfile) {
    extraOptions.push(getVerticalProfileOptions())
  }

  if (!settings.yAxis.yLabel) {
    extraOptions.push(getNoYLabelOptions())
  }

  if (!settings.xAxis.xLabel) {
    extraOptions.push(getNoXLabelOptions())
  }

  if (settings.legend.placement.includes('under')) {
    extraOptions.push(getLegendBelowChartOptions())
  }

  if (options?.isBrush) {
    extraOptions.push(getBrushOptions())
  }

  return merge(getDefaultOptions(), ...extraOptions)
}
