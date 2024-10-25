import * as Plot from '@observablehq/plot'

export default {
  marks: [
    Plot.frame({ stroke: 'currentColor', fill: 'rgb(223, 223, 223)' }),
    Plot.gridX(),
    Plot.gridY(),
  ],
  height: 500,
  marginTop: 30,
  marginRight: 40,
  marginBottom: 40,
  marginLeft: 40,
  style: {
    fontSize: 12,
  },
  // margin: { top: 20, bottom: 20, left: 40, right: 40},
  y: {
    type: 'linear',
    domain: [0, 10],
    label: 'y-axis',
    labelArrow: false,
    labelOffset: 0,
  },
  x: {
    type: 'linear',
    domain: [-40, 30],
    label: 'x-axis',
    labelAnchor: 'center',
    labelArrow: false,
  },
  clip: true,
}
