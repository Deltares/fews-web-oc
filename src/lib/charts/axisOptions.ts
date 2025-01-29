import {
  type CartesianAxesOptions,
  LabelOrientation,
  AxisPosition,
  AxisType,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSettings } from '@/lib/topology/componentSettings'
import { merge } from 'lodash-es'

function getDefaultMargin() {
  return {
    top: 40,
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
  }
}

function getYLabelVerticalOptions(): Partial<CartesianAxesOptions> {
  return {
    y: [
      {
        labelOrientation: LabelOrientation.Vertical,
        labelOffset: 15,
      },
      {
        labelOrientation: LabelOrientation.Vertical,
        labelOffset: 15,
      },
    ],
    margin: {
      top: 20,
      left: getDefaultMargin().left + 15,
    },
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

export function getAxisOptions(
  config: ChartConfig,
  settings:
    | ChartSettings['timeseriesChart']
    | ChartSettings['verticalProfileChart'],
  verticalProfile: boolean,
): CartesianAxesOptions {
  const configOptions: Partial<CartesianAxesOptions> = {
    x: config?.xAxis,
    y: config?.yAxis,
  }

  const extraOptions = [configOptions]

  // TODO: What to do in case of 'auto'?
  if (settings.yAxis.yLabelPlacement === 'beside') {
    extraOptions.push(getYLabelVerticalOptions())
  }

  if (verticalProfile) {
    extraOptions.push(getVerticalProfileOptions())
  }

  if (!settings.yAxis.yLabel) {
    extraOptions.push(getNoYLabelOptions())
  }

  if (!settings.xAxis.xLabel) {
    extraOptions.push(getNoXLabelOptions())
  }

  return merge(getDefaultOptions(), ...extraOptions)
}
