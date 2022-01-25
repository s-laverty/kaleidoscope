import Point from '../point/Point';

/** HexPoint represents a point on a hexagonal grid with two principal axes. */
export default class HexPoint extends Point {
  /**
   * The origin hex point.
   * @readonly
   */
  static origin = new HexPoint(0, 0);

  /**
   * The six possible directions for adjacent hex traversal.
   * @readonly
   */
  static steps = [
    new HexPoint(1, 0),
    new HexPoint(0, 1),
    new HexPoint(-1, 1),
    new HexPoint(-1, 0),
    new HexPoint(0, -1),
    new HexPoint(1, -1),
  ];

  /**
   * Indices of the six possible directions for adjacent hex traversal (can also indicate edges).
   * @readonly
   */
  static argSteps = [...Array(6).keys()];

  /**
   * Steps from this hex to an adjacent one in a direction specified by a number from 0-5 starting
   * from the right moving clockwise.
   * @param {number} i - The number indicating the direction to step in.
   * @returns {HexPoint} A new HexPoint: the result.
   */
  step(i) { return this.add(HexPoint.steps[i]); }

  /**
   * An array of all adjacent HexPoints.
   * @type {HexPoint[]}
   */
  get adjacent() { return HexPoint.argSteps.map(this.step, this); }

  /**
   * Returns whether a point is adjacent to this point.
   * @param {HexPoint} point - A point to check for adjacency.
   * @returns Whether the point is adjacent to this point.
   */
  adjacentTo(point) { return this.adjacent.some((adj) => adj.equals(point)); }
}

/**
 * A tuple of a hex point and a number 0-5 indicating a specific edge (clockwise
 * starting from the right).
 * @typedef {[HexPoint, number]} HexPointEdge
 */

/**
 * A number where each bit 0-5 is a flag representing the corresponding edge of
 * a hex (clockwise starting from the right).
 * @typedef {number} Edges
 */

/**
 * A tuple of a hex point and a number where each bit 0-5 is a flag representing
 * the corresponding edge (clockwise starting from the right).
 * @typedef {[HexPoint, Edges]} HexPointEdges
 */
