/**
 * @vitest-environment jsdom
 */

import { expect, test, describe } from 'vitest'
import {
  clamp,
  floatPrecision,
  roundToStepPrecision,
  roundToDecimalPlaces,
} from './math'

describe('floatPrecision', () => {
  test('with 4 decimal places', () => {
    expect(floatPrecision(54.6545)).toEqual(4)
  })

  test('with 0 decimal places', () => {
    expect(floatPrecision(54)).toEqual(0)
  })

  test('with 1 decimal place', () => {
    expect(floatPrecision(54.1)).toEqual(1)
  })

  test('with negative number', () => {
    expect(floatPrecision(-54.6545)).toEqual(4)
  })
})

describe('roundToStepPrecision', () => {
  test('round to 0.1 with whole number', () => {
    expect(roundToStepPrecision(54, 0.1)).toEqual(54)
  })

  test('round to 0.01 with single decimal number', () => {
    expect(roundToStepPrecision(54.1, 0.01)).toEqual(54.1)
  })

  test('round to 0.1', () => {
    expect(roundToStepPrecision(54.6545, 0.1)).toEqual(54.7)
  })

  test('round to 0.01', () => {
    expect(roundToStepPrecision(54.6545, 0.01)).toEqual(54.65)
  })

  test('round to 1', () => {
    expect(roundToStepPrecision(54.6545, 1)).toEqual(55)
  })

  test('round to 10', () => {
    expect(roundToStepPrecision(54.6545, 10)).toEqual(55)
  })

  test('round to 100', () => {
    expect(roundToStepPrecision(54.6545, 100)).toEqual(55)
  })

  test('round with negative number', () => {
    expect(roundToStepPrecision(-54.6545, 0.1)).toEqual(-54.7)
  })
})

describe('roundToDecimalPlaces', () => {
  test('round to 2 decimal places', () => {
    expect(roundToDecimalPlaces(54.6545, 2)).toEqual(54.65)
  })

  test('round to 1 decimal place', () => {
    expect(roundToDecimalPlaces(54.6545, 1)).toEqual(54.7)
  })

  test('round to 0 decimal places', () => {
    expect(roundToDecimalPlaces(54.6545, 0)).toEqual(55)
  })

  test('round to negative decimal places', () => {
    expect(roundToDecimalPlaces(54.6545, -1)).toEqual(NaN)
  })

  test('round with negative number', () => {
    expect(roundToDecimalPlaces(-54.6545, 2)).toEqual(-54.65)
  })
})

describe('clamp', () => {
  test('within range', () => {
    expect(clamp(5, 0, 10)).toEqual(5)
  })

  test('below range', () => {
    expect(clamp(-5, 0, 10)).toEqual(0)
  })

  test('above range', () => {
    expect(clamp(15, 0, 10)).toEqual(10)
  })

  test('at lower boundary', () => {
    expect(clamp(0, 0, 10)).toEqual(0)
  })

  test('at upper boundary', () => {
    expect(clamp(10, 0, 10)).toEqual(10)
  })

  test('with negative range', () => {
    expect(clamp(-5, -10, -1)).toEqual(-5)
  })

  test('below negative range', () => {
    expect(clamp(-15, -10, -1)).toEqual(-10)
  })

  test('above negative range', () => {
    expect(clamp(0, -10, -1)).toEqual(-1)
  })
})
