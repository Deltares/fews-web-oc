/**
 * Speed curve of the form factor * speed ^ exponent.
 */
export class SpeedCurve {
  private _exponent: number
  private _factor: number

  constructor(exponent: number, factor: number) {
    this._exponent = exponent
    this._factor = factor
  }

  /** Exponent of the curve. */
  get exponent(): number {
    return this._exponent
  }

  /** Factor applied after exponentiation. */
  get factor(): number {
    return this._factor
  }

  /**
   * Returns a speed curve from an exponent and a speed.
   *
   * The specified speed is used to compute the factor of the curve. At this
   * speed, the transformed speed is equal to the original speed.
   *
   * @param exponent  exponent applied to the speed.
   * @param factor factor applied to the transformed speed.
   * @param speed  speed where the transformation does not change the speed
   */
  static fromExponentFactorAndSpeed(
    exponent: number,
    factor: number,
    speed: number,
  ): SpeedCurve {
    const transformedSpeed = Math.pow(speed, exponent)
    const finalFactor = (factor * speed) / transformedSpeed
    return new SpeedCurve(exponent, finalFactor)
  }
}
