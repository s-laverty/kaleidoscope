import CustomSet from '../collections/CustomSet';
/** @typedef {import('./Point').default} Point */

/**
 * A PointSet implements the functionality of the builtin Set using Points as entries.
 * @extends {CustomSet<Point>}
 */
export default class PointSet extends CustomSet {
  /**
   * Creates a PointSet.
   * @param {Point[] | Set<Point> | CustomSet<Point>} [values] - An optional collection of points
   * used to initialize the point set.
   */
  constructor(values) { super(values, String); }
}
