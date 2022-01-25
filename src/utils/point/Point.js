import {
  add, ceil, deepEqual, divide, floor, multiply, subtract,
} from 'mathjs';

/**
 * A point is an immutable array representing a n-dimensional point.
 * @extends {Array<number>}
 */
export default class Point extends Array {
  /**
   * Checks whether two points are equal.
   * @param {Point} p1 - The first point to compare for equality.
   * @param {Point} p2 - The second point to compare for equality.
   * @returns {boolean} Whether the points are exactly equal.
   */
  static equal(p1, p2) { return deepEqual(p1, p2); }

  /**
   * A cached version of this.toString()
   * @type {string} @readonly
   */
  #key;

  /**
   * Creates a Point from argument components.
   * @param  {...number} coords - A list of point components.
   */
  constructor(...coords) {
    super(...coords);
    this.#key = super.toString();
    Object.freeze(this);
  }

  toString() { return this.#key; }

  /**
   * Checks whether this point is equal to another point.
   * @param {Point} other - A point to compare this one to.
   * @returns {boolean} Whether the two points are equal.
   */
  equals(other) { return other instanceof Point && Point.equal(this, other); }

  /**
   * Adds another point to this point.
   * @param {Point} other - The point to add.
   * @returns {Point} The sum of this point and the other point.
   */
  add(other) { return new this.constructor(...add(this, other)); }

  /**
   * Subtracts another point from this point.
   * @param {Point} other - The point to subtract.
   * @returns {Point} The difference of this point and the other point.
   */
  subtract(other) { return new this.constructor(...subtract(this, other)); }

  /**
   * Multiplies the point by a scalar factor.
   * @param {number} other - The scalar multiplier.
   * @returns {Point} The product of this point and a scalar multiplier.
   */
  multiply(other) { return new this.constructor(...multiply(this, other)); }

  /**
   * Divides the point by a scalar factor.
   * @param {number} other - The scalar divisor.
   * @returns The quotient of this point divided by a scalar factor.
   */
  divide(other) { return new this.constructor(...divide(this, other)); }

  /**
   * Rounds down every component in the point to the nearest integer.
   * @returns {Point} The point with all components rounded down.
   */
  floor() { return new this.constructor(...floor([...this])); }

  /**
   * Rounds up every component in the point to the nearest integer.
   * @returns {Point} The point with all components rounded up.
   */
  ceil() { return new this.constructor(...ceil([...this])); }
}
