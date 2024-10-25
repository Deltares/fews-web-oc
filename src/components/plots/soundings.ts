import * as Plot from '@observablehq/plot'
import soundings from '@/assets/soundings.json'

const initialTemperatures = Array.from({ length: 29 }, (_, i) => -140 + i * 10)
const pressures = [1050, 1000, 900, 800, 700, 500, 300, 200, 150, 120, 100]
const P0 = 1050 // Reference pressure (hPa)

function celsiusToKelvin(celsius: number) {
  return celsius + 273.15
}

function kelvinToCelsius(kelvin: number) {
  return kelvin - 273.15
}

function calculateSkewedTemperature(temperature: number, pressure: number, skewFactor = 35) {
  const logPressure = Math.log(pressure) - Math.log(P0)
  return temperature - skewFactor * logPressure
}

const data = []

const dryAdiabat = initialTemperatures.flatMap((T0) => {
  // const H = 7000 // meters
  const Rd = 287.058
  const Cp = 1005.2
  // const lapseRate = 9.8 / 1000 // Dry adiabatic lapse rate in °C/m
  return pressures.map((P) => {
    const temperature = kelvinToCelsius(
      celsiusToKelvin(T0) * Math.pow(P / P0, Rd / Cp),
    )
    return {
      label: T0,
      dryAdiabat: calculateSkewedTemperature(temperature, P),
      temperature,
      pressure: P,
    }
  })
})

for (const d of dryAdiabat) {
  data.push(d)
}

const skewtSounding = soundings.map((point) => {
  const { pressure, temperature, dewpoint } = point

  // Skew the temperature and dew point by the skew factor and pressure
  const skewedTemperature = calculateSkewedTemperature(temperature, pressure)
  const skewedDewpoint = calculateSkewedTemperature(dewpoint, pressure)

  // Return the new skewed data point
  return {
    pressure,
    temperature,
    skewedTemperature,
    dewpoint,
    skewedDewpoint,
  }
})

for (const d of skewtSounding) {
  data.push(d)
}

const isoTherms = initialTemperatures.flatMap((d) => {
  return [
    {
      label: `isotherm-${d}`,
      isotherm: calculateSkewedTemperature(d, 1050),
      pressure: 1050,
    },
    {
      label: `isotherm-${d}`,
      isotherm: calculateSkewedTemperature(d, 100),
      pressure: 100,
    },
  ]
})

for (const d of isoTherms) {
  data.push(d)
}

export default {
  marks: [
    Plot.frame({ stroke: 'currentColor', fill: 'rgb(223, 223, 223)' }),
    Plot.gridY({
      stroke: 'white',
      strokeWidth: 1,
      strokeOpacity: 1,
      strokeDasharray: '4, 2',
    }),
    Plot.line(isoTherms, {
      x: 'isotherm',
      y: 'pressure',
      z: 'label',
      stroke: 'white',
      strokeWidth: 1,
      strokeDasharray: '4, 2',
    }),

    Plot.line(data, {
      x: 'dryAdiabat',
      y: 'pressure',
      z: 'label',
      stroke: 'white',
      curve: 'monotone-y',
      strokeWidth: 0.5,
    }),
    Plot.lineX(data, {
      x: 'skewedTemperature',
      y: 'pressure',
      stroke: 'red',
    }),
    Plot.lineX(data, {
      x: 'skewedDewpoint',
      y: 'pressure',
      stroke: 'green',
    }),
    // Plot.ruleY(skewtSounding, Plot.pointerY({ y: "pressure", stroke: 'gray', strokeDasharray: [4,2]})),
    Plot.dot(
      data,
      Plot.pointerY({ x: 'skewedTemperature', y: 'pressure', stroke: 'red' }),
    ),
    Plot.dot(
      data,
      Plot.pointerY({ x: 'skewedDewpoint', y: 'pressure', stroke: 'green' }),
    ),
    Plot.crosshairY(data, { x: 'skewedTemperature', y: 'pressure' }),
    Plot.crosshairY(data, { x: 'skewedDewpoint', y: 'pressure' }),
  ],
  height: 700,
  marginTop: 30,
  marginRight: 40,
  marginBottom: 40,
  marginLeft: 40,
  color: { legend: true },
  style: {
    fontSize: 12,
  },
  // margin: { top: 20, bottom: 20, left: 40, right: 40},
  y: {
    type: 'log',
    domain: [1050, 100],
    label: 'pressure (hPa)',
    labelArrow: false,
    labelOffset: 0,
  },
  x: {
    type: 'linear',
    domain: [-40, 30],
    label: 'Temperature',
    labelAnchor: 'center',
    labelArrow: false,
  },
  clip: true,
}
